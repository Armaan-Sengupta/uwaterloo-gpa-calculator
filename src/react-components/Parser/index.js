import React from "react";
import "./styles.css";
import { parseTranscript, TranscriptFormatError } from "../../transcript/parseTranscript";
import { countsForGpa, percentToGpa, summarize } from "../../transcript/gpa";

/**
 * This file contains the transcript input (PDF upload or pasted text) and the GPA results.
 * Everything runs in the browser: the transcript is never uploaded anywhere.
*/

const formatNum = (value, digits) => (value === null ? "–" : value.toFixed(digits));
const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

class Parser extends React.Component{
    constructor(){
        super();
        this.state = {
            transcriptTextArea: "",
            status: null,       // { kind: "info" | "error" | "success", message }
            transcript: null,   // result of parseTranscript
            included: {},       // course id -> whether it counts towards the GPA
            dragging: false,
        };
        this.fileInput = React.createRef();
        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleFile = this.handleFile.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
    }

    // called when the user updates the transcript text area
    handleChange(event){
        this.setState({transcriptTextArea: event.target.value})
    }

    // called when the user presses the Calculate button for pasted text
    handleClick(){
        if (this.state.transcriptTextArea.trim() === ""){
            this.setState({status: {kind: "error", message: "Paste your transcript first!"}, transcript: null});
            return;
        }
        this.loadText(this.state.transcriptTextArea, null);
    }

    handleDrop(event){
        event.preventDefault();
        this.setState({dragging: false});
        const file = event.dataTransfer.files[0];
        if (file) this.handleFile(file);
    }

    // reads an uploaded PDF, unlocking it in the browser if it is copy-protected
    async handleFile(file){
        if (!file) return;
        if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)){
            this.setState({status: {kind: "error", message: `"${file.name}" isn't a PDF. Upload the transcript PDF from Quest.`}, transcript: null});
            return;
        }
        this.setState({status: {kind: "info", message: `Reading ${file.name}…`}, transcript: null});
        try {
            // pdf.js is only loaded once a PDF is actually chosen
            const { extractPdfText } = await import("../../transcript/pdfText");
            const { text, wasRestricted } = await extractPdfText(file);
            const note = wasRestricted
                ? "The PDF was copy-protected, so it was unlocked in your browser. "
                : "";
            this.loadText(text, note);
        } catch (err){
            const message = err.name === "InvalidPDFException"
                ? "That file couldn't be read as a PDF. It may be damaged."
                : err.message || "Something went wrong reading the PDF.";
            this.setState({status: {kind: "error", message}, transcript: null});
        } finally {
            if (this.fileInput.current) this.fileInput.current.value = "";
        }
    }

    // parses transcript text and checks it is in the expected format
    loadText(text, unlockNote){
        try {
            const transcript = parseTranscript(text);
            const included = {};
            transcript.courses.forEach(course => { included[course.id] = countsForGpa(course); });
            const graded = transcript.courses.filter(countsForGpa).length;
            this.setState({
                transcript,
                included,
                status: {
                    kind: "success",
                    message: `${unlockNote || ""}Recognized a UWaterloo unofficial transcript: ${plural(transcript.terms.length, "term")}, ${plural(graded, "graded course")}.`,
                },
            });
        } catch (err){
            const message = err instanceof TranscriptFormatError
                ? `${err.message} Make sure you're using the Undergraduate Unofficial Transcript from Quest.`
                : "Something went wrong reading the transcript.";
            this.setState({status: {kind: "error", message}, transcript: null});
        }
    }

    toggleCourse(id){
        this.setState(state => ({included: {...state.included, [id]: !state.included[id]}}));
    }

    renderResults(){
        const { transcript, included } = this.state;
        const counted = transcript.courses.filter(course => included[course.id] && countsForGpa(course));
        const overall = summarize(counted);
        const termsWithGrades = transcript.terms.filter(term => term.courses.length > 0);

        return (
            <section className="results" aria-live="polite">
                <div className="cards">
                    <div className="card card-main">
                        <div className="card-label">Cumulative GPA (OMSAS 4.0)</div>
                        <div className="card-value">{formatNum(overall.gpa, 2)}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Weighted average</div>
                        <div className="card-value">{formatNum(overall.avg, 2)}%</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Courses counted</div>
                        <div className="card-value">{overall.count}</div>
                        <div className="card-sub">{formatNum(overall.units, 2)} units</div>
                    </div>
                </div>
                {transcript.program && <p className="program">{transcript.program}</p>}
                <p className="info-card">Your unweighted average was calculated to be <strong>{formatNum(overall.unweightedAvg, 2)}%</strong>.</p>

                <h3 className="section-header">By term</h3>
                <p className="hint">Untick a course to see your GPA without it.</p>
                {termsWithGrades.map(term => {
                    const termSummary = summarize(term.courses.filter(course => included[course.id] && countsForGpa(course)));
                    return (
                        <details className="term" key={term.name} open={termSummary.count > 0}>
                            <summary>
                                <span className="term-name">{term.name}{term.level ? ` · ${term.level}` : ""}</span>
                                <span className="term-stats">
                                    {termSummary.count > 0
                                        ? `GPA ${formatNum(termSummary.gpa, 2)} · ${formatNum(termSummary.avg, 2)}%`
                                        : "No graded courses"}
                                </span>
                            </summary>
                            <div className="table-wrap">
                                <table className="course-table">
                                    <thead>
                                        <tr><th></th><th>Course</th><th>Units</th><th>Grade</th><th>GPA</th></tr>
                                    </thead>
                                    <tbody>
                                        {term.courses.map(course => {
                                            const eligible = countsForGpa(course);
                                            return (
                                                <tr key={course.id} className={eligible && included[course.id] ? "" : "row-excluded"}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            aria-label={`Count ${course.code}`}
                                                            checked={eligible && included[course.id]}
                                                            disabled={!eligible}
                                                            onChange={() => this.toggleCourse(course.id)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <strong>{course.code}</strong> {course.title}
                                                        {course.topic && <span className="note"> ({course.topic})</span>}
                                                        {course.excludedReason && <span className="note"> · {course.excludedReason}</span>}
                                                        {course.notInQuestAverage && <span className="note"> · not in Quest's average, counted by OMSAS</span>}
                                                    </td>
                                                    <td>{course.attempted === null ? "–" : course.attempted.toFixed(2)}</td>
                                                    <td>{course.grade || "–"}</td>
                                                    <td>{course.numericGrade === null ? "–" : percentToGpa(course.numericGrade).toFixed(1)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </details>
                    );
                })}
            </section>
        );
    }

    render(){
        const { status, transcript, dragging } = this.state;
        return(
            <div>
                <label
                    className={`drop-zone ${dragging ? "drop-zone-active" : ""}`}
                    onDragOver={event => { event.preventDefault(); this.setState({dragging: true}); }}
                    onDragLeave={() => this.setState({dragging: false})}
                    onDrop={this.handleDrop}
                >
                    <input
                        ref={this.fileInput}
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={event => this.handleFile(event.target.files[0])}
                    />
                    <span className="drop-title">Drop your transcript PDF here</span>
                    <span className="drop-sub">or click to choose a file. Copy-protected PDFs from Quest work fine.</span>
                </label>

                <details className="paste">
                    <summary>Or paste the transcript text instead</summary>
                    <textarea
                        className="text-area-transcript"
                        rows = "10"
                        placeholder = "Paste your transcript here"
                        onChange={this.handleChange}
                    ></textarea>
                    <button className="btn-calculate" onClick={this.handleClick}>Calculate</button>
                </details>

                {status && <p className={`status status-${status.kind}`} role={status.kind === "error" ? "alert" : "status"}>{status.message}</p>}
                {transcript && this.renderResults()}
            </div>
        )
    }
}

export default Parser;
