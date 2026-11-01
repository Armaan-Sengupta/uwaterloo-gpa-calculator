import React from "react";
import "./styles.css";

class Header extends React.Component{
    render(){
        return(
            <div>
                <header className="header">
                    <img src={require('../../img/waterloo_logo.png')} alt="University of Waterloo logo"></img>
                    <h1 className="title">UWaterloo GPA Calculator</h1>
                </header>
                <hr></hr>
                <ol className="steps-list">
                    <li>In <a href="https://uwaterloo.ca/quest/">Quest</a>, open <strong>Grades {'->'} My Academics {'->'} Unofficial Transcript</strong></li>
                    <li>Click <strong>View Report</strong> and save the PDF</li>
                    <li>Drop it below</li>
                </ol>
            </div>

        )
    }
}

export default Header;
