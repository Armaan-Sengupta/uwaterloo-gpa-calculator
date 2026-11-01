# [University of Waterloo GPA Calculator](https://armaan-sengupta.github.io/uwaterloo-gpa-calculator/)

This tool reads your Quest unofficial transcript PDF and calculates your cumulative GPA on the [OMSAS](https://www.ouac.on.ca/guide/omsas-gpa-calculations/) 4.0 scale, using Scale 3 of the [Undergraduate Grade Conversion Table](https://www.ouac.on.ca/guide/undergraduate-grade-conversion-table/).

## Instructions
1. Log into [Quest](https://uwaterloo.ca/quest/).

2. Go to Grades -> My Academics -> Unofficial Transcript.

3. Select your applicable Report Type, click View Report and save the PDF.

4. Drop the PDF into the calculator. Quest's copy protection is handled automatically. You can still paste the transcript text instead if you prefer.

## How the GPA is calculated
- Each percentage grade is converted to the 4.0 scale with OMSAS Scale 3 (90-100 = 4.0, 85-89 = 3.9, 80-84 = 3.7, ...).
- Each course is weighted by its units (attempted credit), so a 0.75-unit course counts 1.5x a 0.50-unit course.
- Every numerically graded course counts, including failed courses and work-term reports. CR/NCR courses and courses in progress do not.
- The transcript's own cumulative average is recomputed and compared with the value Quest prints, to confirm every course was read correctly.

## Changes in this fork
- Upload the transcript PDF directly; copy-protected PDFs are read with [pdf.js](https://mozilla.github.io/pdf.js/) in the browser.
- Checks that the file is a UWaterloo unofficial transcript before calculating.
- Fixes course weighting: the original parsed weights with `parseInt("0.50")`, which is `0`, so every course was weighted equally.
- Handles wrapped course titles, CR grades, "Not in Average" courses and in-progress courses.
- Term-by-term breakdown, with checkboxes to see your GPA without certain courses.

## Development
```
npm install
npm start      # dev server
npm test       # parser and GPA tests
```
Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Privacy
None of your personal data is stored. There is no database to store your information remotely in this project, since your transcript PDF is opened and read entirely in your browser. Everything is discarded once you exit the page.

## Acknowledgements
This project was heavily inspired by Github user [Abdallah Arar](https://github.com/abdallaharar) and their very similar project found ([here](https://github.com/abdallaharar/autogpa-uwaterloo#readme)).

About 5 years ago, UWaterloo changed their transcript format which subsequently broke their calculator.

Thus, the goal for this project was to create an updated GPA calculator for students to use that would work with the new UWaterloo transcript format, while also using the React.js framework for cleaner code.