import React from "react";
import "./styles.css";
import { OMSAS_SCALE } from "../../transcript/gpa";
import TermChart from "../TermChart";

/**
 * Explains how the GPA is calculated, so users can check the method (and so search engines have real content to index).
*/

// "90–100", "85–89", ..., "0–49"
function scaleRanges(){
    return OMSAS_SCALE.map((step, i) => {
        const max = i === 0 ? 100 : OMSAS_SCALE[i - 1].min - 1;
        return { range: `${step.min}–${max}`, gpa: step.gpa.toFixed(1) };
    });
}

class About extends React.Component{
    render(){
        return(
            <section className="about">
                <details>
                <summary><h2 className="about-header">How your GPA is calculated</h2></summary>
                <p>
                    The University of Waterloo doesn't use a 4.0 GPA. Quest reports percentage grades and a cumulative average.
                    This calculator follows the method <a href="https://www.ouac.on.ca/guide/omsas-gpa-calculations/">OMSAS</a> uses
                    when Ontario medical schools convert a Waterloo transcript, which is also the most common way to quote a Waterloo GPA:
                </p>
                <ol>
                    <li>
                        Each percentage grade is converted with the
                        OUAC <a href="https://www.ouac.on.ca/guide/undergraduate-grade-conversion-table/">Undergraduate Grade Conversion Table</a>,
                        using Scale 3 (Waterloo's percentage scale).
                    </li>
                    <li>
                        Each course is weighted by its units, so a 0.75-unit course counts 1.5 times as much as a 0.50-unit course,
                        and a 0.13-unit work-term report counts about a quarter as much.
                    </li>
                    <li>
                        All numerically graded courses count, including failed courses and work-term reports. Courses graded
                        CR/NCR (co-op terms, PD courses) and courses still in progress are left out.
                    </li>
                    <li>The cumulative GPA is the total weighted grade points divided by the total units. It is not an average of term GPAs.</li>
                </ol>
                <p>
                    The cumulative average matches the "Cumulative GPA" Quest prints: a unit-weighted percentage average that leaves out courses marked "Not in Average" (such as work-term reports).
                </p>

                <TermChart points={this.props.termGpas} />
                <div className="table-wrap">
                    <table className="scale-table">
                        <caption>OMSAS conversion, Scale 3</caption>
                        <thead><tr><th>Percentage</th><th>4.0 GPA</th></tr></thead>
                        <tbody>
                            {scaleRanges().map(row => (
                                <tr key={row.range}><td>{row.range}</td><td>{row.gpa}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <h2 className="about-header">Privacy</h2>
                <p>
                    Your transcript never leaves your device. The PDF is opened and read by JavaScript in your browser, and there is
                    no server or database. Closing the tab discards everything.
                </p>
                </details>
                <p className="disclaimer">
                    Unofficial; not affiliated with UWaterloo or OUAC. Forked
                    from <a href="https://github.com/caseOfCamel/uwaterloo-gpa-calculator">caseOfCamel/uwaterloo-gpa-calculator</a>.
                    Last updated {process.env.REACT_APP_UPDATED}.
                </p>
            </section>
        )
    }
}

export default About;
