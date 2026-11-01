import React from "react";
import "./styles.css";

class Header extends React.Component{
    render(){
        return(
            <div>
                <header className="header">
                    <img src={require('../../img/waterloo_logo.png')} alt="University of Waterloo logo"></img>
                    <h1 className="title">UWaterloo GPA Calculator</h1>
                    <p className="tagline">
                        Upload your Quest transcript PDF to get your cumulative GPA on the OMSAS 4.0 scale, with a term-by-term breakdown.
                    </p>
                </header>
                <hr></hr>
                <div className="steps">
                    <h2 className="steps-header">Steps</h2>
                        <ol className="steps-list">
                            <li>Log into <a href="https://uwaterloo.ca/quest/">Quest</a></li>
                            <li>Go to <em><strong>Grades {'->'} My Academics {'->'} Unofficial Transcript</strong></em></li>
                            <li>Select your applicable Report Type, then click <strong>View Report</strong> and <strong>save the PDF</strong>.</li>
                            <li>
                                <strong>Drop the PDF</strong> into the box below. Quest's copy protection is removed automatically,
                                and the file is read entirely in your browser. Nothing is uploaded.
                            </li>
                        </ol>
                </div>
            </div>

        )
    }
}

export default Header;
