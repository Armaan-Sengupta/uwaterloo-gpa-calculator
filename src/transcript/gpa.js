/**
 * GPA math, following the OMSAS rules (https://www.ouac.on.ca/guide/omsas-gpa-calculations/):
 *  - percentage grades are converted with the Undergraduate Grade Conversion Table; UWaterloo's percentages use Scale 3
 *  - courses are weighted by length (a 0.50-unit term course weighs 1, 0.75 weighs 1.5, ...), i.e. in proportion to units
 *  - every course with a grade counts, including failed courses and courses extra to degree requirements
 *  - courses graded "Pass" or "Credit" are left out
 *  - the cumulative GPA is total weighted points / total weight, not an average of term averages
 */

// OUAC Undergraduate Grade Conversion Table, Scale 3 (https://www.ouac.on.ca/guide/undergraduate-grade-conversion-table/)
export const OMSAS_SCALE = [
    { min: 90, gpa: 4.0 },
    { min: 85, gpa: 3.9 },
    { min: 80, gpa: 3.7 },
    { min: 77, gpa: 3.3 },
    { min: 73, gpa: 3.0 },
    { min: 70, gpa: 2.7 },
    { min: 67, gpa: 2.3 },
    { min: 63, gpa: 2.0 },
    { min: 60, gpa: 1.7 },
    { min: 57, gpa: 1.3 },
    { min: 53, gpa: 1.0 },
    { min: 50, gpa: 0.7 },
    { min: 0, gpa: 0.0 },
];

/**
 * Converts a percentage grade to its OMSAS 4.0 value
 * @param {number} percent
 * @returns {number}
 */
export function percentToGpa(percent){
    return OMSAS_SCALE.find(step => percent >= step.min).gpa;
}

/**
 * Whether a course counts towards the OMSAS GPA: it has a numeric grade and a non-zero weight
 * @param {object} course A course from parseTranscript
 */
export function countsForGpa(course){
    return course.excludedReason === null;
}

/**
 * Whether a course counts towards the cumulative average that Quest prints on the transcript
 * @param {object} course A course from parseTranscript
 */
export function countsForQuestAverage(course){
    return countsForGpa(course) && !course.notInQuestAverage;
}

/**
 * Computes the unit-weighted percentage average and OMSAS GPA over a set of courses
 * @param {Array<object>} courses Courses with numericGrade and attempted units
 * @returns {{units: number, count: number, avg: number|null, unweightedAvg: number|null, gpa: number|null}}
 */
export function summarize(courses){
    let units = 0, percentTotal = 0, gpaTotal = 0, plainTotal = 0;
    courses.forEach(course => {
        units += course.attempted;
        plainTotal += course.numericGrade;
        percentTotal += course.numericGrade * course.attempted;
        gpaTotal += percentToGpa(course.numericGrade) * course.attempted;
    });
    if (units === 0) return { units: 0, count: 0, avg: null, unweightedAvg: null, gpa: null };
    return {
        units,
        count: courses.length,
        avg: percentTotal / units,
        // plain mean of the percentage grades, every course counting equally
        unweightedAvg: plainTotal / courses.length,
        gpa: gpaTotal / units,
    };
}
