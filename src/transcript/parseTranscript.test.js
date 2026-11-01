import { parseTranscript, TranscriptFormatError } from "./parseTranscript";
import { countsForGpa, countsForQuestAverage, percentToGpa, summarize } from "./gpa";

// a made-up transcript in the Quest layout, including a page break, a wrapped title,
// credit-only courses, a work-term report and in-progress courses
const SAMPLE = `
University of Waterloo
200 University Ave. West
Waterloo Ontario Canada N2L3G1
01/01/2026
Undergraduate Unofficial Transcript
Name:           Student, Sample
Student ID:   12345678
Beginning of Undergraduate Record
Fall 2024
Program: Systems Design Engineering, Honours, Co-operative Program
   Level:           1A               Form Of Study: Enrolment
Course Description Attempted Earned Grade
MATH  115 Linear Algebra for Engineering 0.50 0.50 92
SYDE  101 Communications in Systems Design 0.75 0.75 80
SYDE  121 Digital Computation 0.50 0.50 65
SYDE  192 Digital Systems
Laboratory
0.25 0.25 49
MTHEL   99 First-Year Mathematics Readiness 0.00 0.00 CR
Course Topic:  First year readiness
In GPA Earned
Term GPA 75.00 Term Totals 2.00 2.00
Cumulative GPA 75.00 Cumulative Totals 2.00 2.00

University of Waterloo
200 University Ave. West
Waterloo Ontario Canada N2L3G1
01/01/2026
Undergraduate Unofficial Transcript
Winter 2025
Program: Systems Design Engineering, Honours, Co-operative Program
   Level:           1A               Form Of Study: Co-op Work Term
Course Description Attempted Earned Grade
COOP    1 Co-operative Work Term 0.50 0.00 CR
WKRPT  100 Work-term Report 0.13 0.13 70
Degree Requirement, Not in Average
In GPA Earned
Term GPA 0.00 Term Totals 0.50 0.13
Cumulative GPA 75.00 Cumulative Totals 2.00 2.13
Spring 2025
Program: Systems Design Engineering, Honours, Co-operative Program
   Level:           1B               Form Of Study: Enrolment
Course Description Attempted Earned Grade
SYDE  112 Calculus 2
SYDE  162 Human Factors in Design
End of Undergraduate Unofficial Transcript
`;

test("rejects text that isn't a UWaterloo unofficial transcript", () => {
    expect(() => parseTranscript("hello world")).toThrow(TranscriptFormatError);
    expect(() => parseTranscript("University of Waterloo official letter")).toThrow(TranscriptFormatError);
});

test("reads terms, courses, wrapped titles and topics", () => {
    const t = parseTranscript(SAMPLE);
    expect(t.terms.map(term => term.name)).toEqual(["Fall 2024", "Winter 2025", "Spring 2025"]);
    expect(t.courses).toHaveLength(9);
    const lab = t.courses.find(c => c.code === "SYDE 192");
    expect(lab).toMatchObject({ title: "Digital Systems Laboratory", attempted: 0.25, numericGrade: 49 });
    expect(t.courses.find(c => c.code === "MTHEL 99").topic).toBe("First year readiness");
    expect(t.reportedCumulativeAvg).toBe(75);
    expect(t.terms[0].level).toBe("1A");
});

test("classifies courses that don't count", () => {
    const t = parseTranscript(SAMPLE);
    const byCode = code => t.courses.find(c => c.code === code);
    expect(byCode("COOP 1").excludedReason).toMatch(/Non-numeric/);
    expect(byCode("SYDE 112").excludedReason).toBe("In progress");
    expect(byCode("WKRPT 100").notInQuestAverage).toBe(true);
    expect(countsForGpa(byCode("WKRPT 100"))).toBe(true);
    expect(countsForQuestAverage(byCode("WKRPT 100"))).toBe(false);
});

test("weights by units and reproduces Quest's printed average", () => {
    const t = parseTranscript(SAMPLE);
    const quest = summarize(t.courses.filter(countsForQuestAverage));
    // (92*0.5 + 80*0.75 + 65*0.5 + 49*0.25) / 2.0 = 75.375
    expect(quest.units).toBeCloseTo(2.0);
    expect(quest.avg).toBeCloseTo(75.375);
});

test("OMSAS GPA weights converted grades by units and includes the work-term report", () => {
    const t = parseTranscript(SAMPLE);
    const omsas = summarize(t.courses.filter(countsForGpa));
    // (4.0*0.5 + 3.7*0.75 + 2.0*0.5 + 0.0*0.25 + 2.7*0.13) / 2.13
    expect(omsas.gpa).toBeCloseTo((2.0 + 2.775 + 1.0 + 0 + 0.351) / 2.13, 6);
});

test("OMSAS Scale 3 boundaries", () => {
    const cases = [[100, 4.0], [90, 4.0], [89, 3.9], [85, 3.9], [84, 3.7], [80, 3.7], [79, 3.3], [77, 3.3],
        [76, 3.0], [73, 3.0], [72, 2.7], [70, 2.7], [69, 2.3], [67, 2.3], [66, 2.0], [63, 2.0], [62, 1.7],
        [60, 1.7], [59, 1.3], [57, 1.3], [56, 1.0], [53, 1.0], [52, 0.7], [50, 0.7], [49, 0], [0, 0]];
    cases.forEach(([percent, gpa]) => expect(percentToGpa(percent)).toBe(gpa));
});
