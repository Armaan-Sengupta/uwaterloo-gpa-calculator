/**
 * Parses the text of a UWaterloo Quest "Undergraduate Unofficial Transcript" into terms and courses.
 * Works on the line-by-line text produced either by our PDF reader or by copy-pasting from a PDF viewer.
 */

// lines repeated at the top of every page of the transcript
const PAGE_HEADER_PATTERNS = [
    /^University of Waterloo$/,
    /^200 University Ave/,
    /^Waterloo Ontario Canada/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^Undergraduate Unofficial Transcript$/,
    /^Name:/,
    /^Student ID:/,
    /^Ontario Education Nbr:/,
];

// lines that end the course list of a term
const SECTION_END_PATTERNS = [
    /^In GPA Earned/,
    /^Term GPA/,
    /^Cumulative GPA/,
    /^Academic Standing/,
    /^Term Honours/,
    /^Program:/,
    /^Level:/,
    /^Milestones$/,
    /^Scholarships and Awards$/,
    /^End of /,
    /^Beginning of /,
];

const TERM_RE = /^(Fall|Winter|Spring)\s+(\d{4})$/;
const COURSE_HEADER_RE = /^Course\s+Description\s+Attempted\s+Earned\s+Grade$/;
const COURSE_START_RE = /^([A-Z]{2,6})\s+(\d{1,3}[A-Z]{0,2})(?:\s+(.*))?$/;
// "0.50 0.50 87" or "0.50 0.00 CR": attempted units, earned units, grade
const UNITS_GRADE_RE = /(?:^|\s)(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d{1,3}|[A-Z]{1,4})(?=\s|$)/;
const LEVEL_RE = /Level:\s+(\w+)/;
const REPORTED_TERM_RE = /^Term GPA\s+(\d+\.\d{2})/;
const REPORTED_CUM_RE = /^Cumulative GPA\s+(\d+\.\d{2})/;

export class TranscriptFormatError extends Error {}

/**
 * Checks that the text looks like a UWaterloo unofficial transcript, throwing a TranscriptFormatError if not
 * @param {string} text The transcript text
 */
function checkFormat(text){
    if (!/University of Waterloo/.test(text)){
        throw new TranscriptFormatError("This doesn't look like a University of Waterloo document.");
    }
    if (!/Unofficial Transcript/.test(text)){
        throw new TranscriptFormatError("This looks like a UWaterloo document, but not an unofficial transcript from Quest.");
    }
    if (!/Course\s+Description\s+Attempted\s+Earned\s+Grade/.test(text)){
        throw new TranscriptFormatError("No course tables were found in this transcript.");
    }
}

/**
 * Builds a course object from the joined lines of one course row
 * @param {string} rowText e.g. "MTE 241 Introduction to Computer Structures 0.50 0.50 82 Systems"
 * @param {object} term The term the course was taken in
 */
function buildCourse(rowText, term){
    const [, subject, catalog, rest = ""] = rowText.match(COURSE_START_RE);
    const unitsMatch = rest.match(UNITS_GRADE_RE);
    let title = rest;
    let attempted = null, earned = null, grade = null;
    if (unitsMatch){
        // the units/grade may sit between two wrapped halves of the title, so cut them out of the middle
        title = (rest.slice(0, unitsMatch.index) + " " + rest.slice(unitsMatch.index + unitsMatch[0].length));
        attempted = parseFloat(unitsMatch[1]);
        earned = parseFloat(unitsMatch[2]);
        grade = unitsMatch[3];
    }
    const numericGrade = grade !== null && /^\d+$/.test(grade) ? parseInt(grade, 10) : null;
    let excludedReason = null;
    if (grade === null) excludedReason = "In progress";
    else if (numericGrade === null) excludedReason = `Non-numeric grade (${grade})`;
    else if (attempted === 0) excludedReason = "Zero weight";

    return {
        id: `${term.name}|${subject} ${catalog}|${term.courses.length}`,
        term: term.name,
        code: `${subject} ${catalog}`,
        title: title.replace(/\s+/g, " ").trim(),
        topic: null,
        attempted,
        earned,
        grade,
        numericGrade,
        excludedReason,
        notInQuestAverage: false,
    };
}

/**
 * Parses transcript text into terms and courses
 * @param {string} text The transcript text
 * @returns {{program: string|null, terms: Array<object>, courses: Array<object>, reportedCumulativeAvg: number|null}}
 */
export function parseTranscript(text){
    checkFormat(text);

    const lines = text.split(/\r?\n/).map(line => line.replace(/\s+/g, " ").trim()).filter(Boolean);
    const terms = [];
    let program = null;
    let term = null;
    let inCourseTable = false;
    let rowLines = [];

    const flushRow = () => {
        if (rowLines.length && term){
            term.courses.push(buildCourse(rowLines.join(" "), term));
        }
        rowLines = [];
    };
    const lastCourse = () => (term && term.courses[term.courses.length - 1]) || null;

    for (const line of lines){
        if (PAGE_HEADER_PATTERNS.some(re => re.test(line))) continue;

        const termMatch = line.match(TERM_RE);
        if (termMatch){
            flushRow();
            term = { name: line, level: null, courses: [], reportedTermAvg: null, reportedCumulativeAvg: null };
            terms.push(term);
            inCourseTable = false;
            continue;
        }
        if (!term) continue;

        if (COURSE_HEADER_RE.test(line)){
            flushRow();
            inCourseTable = true;
            continue;
        }

        if (SECTION_END_PATTERNS.some(re => re.test(line))){
            flushRow();
            inCourseTable = false;
            if (!program && line.startsWith("Program:")) program = line.slice("Program:".length).trim();
            const levelMatch = line.match(LEVEL_RE);
            if (levelMatch) term.level = levelMatch[1];
            const termAvg = line.match(REPORTED_TERM_RE);
            if (termAvg) term.reportedTermAvg = parseFloat(termAvg[1]);
            const cumAvg = line.match(REPORTED_CUM_RE);
            if (cumAvg) term.reportedCumulativeAvg = parseFloat(cumAvg[1]);
            continue;
        }

        if (!inCourseTable) continue;

        const topicMatch = line.match(/^Course Topic:\s*(.*)$/);
        if (topicMatch){
            flushRow();
            if (lastCourse()) lastCourse().topic = topicMatch[1].trim();
            continue;
        }
        if (/^Degree Requirement, Not in Average/.test(line)){
            flushRow();
            // e.g. work-term reports: graded, but left out of Quest's average (OMSAS still counts them)
            if (lastCourse()) lastCourse().notInQuestAverage = true;
            continue;
        }
        if (COURSE_START_RE.test(line)){
            flushRow();
            rowLines = [line];
        } else if (rowLines.length){
            // a wrapped course title or the units/grade printed on their own line
            rowLines.push(line);
        }
    }
    flushRow();

    const courses = terms.flatMap(t => t.courses);
    if (courses.length === 0){
        throw new TranscriptFormatError("The transcript was recognized, but no courses could be read from it.");
    }
    const reported = terms.filter(t => t.reportedCumulativeAvg !== null);
    return {
        program,
        terms,
        courses,
        reportedCumulativeAvg: reported.length ? reported[reported.length - 1].reportedCumulativeAvg : null,
    };
}
