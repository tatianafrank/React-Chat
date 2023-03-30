import React, { useState } from "react";
import styled from "styled-components";
import './KeyButtons.css'
import { useKeys, useKeysDispatch } from './KeysContext';

/** HTML and logic for gray buttons below chat window */

export default function KeyButtons() {
    const { intenseButton, resumeButton, aftercareButton, skipSustainedButton, skipMcoButton, skipAftercareButton} = useKeys();
    const keysDispatch = useKeysDispatch();
    const Button = styled.button``;
    const zKeyEvent = new Event("keydown");
    zKeyEvent.key = 'z';
    const fKeyEvent = new Event("keydown");
    fKeyEvent.key = 'f';
    const kKeyEvent = new Event("keydown");
    kKeyEvent.key = 'k';
    const cKeyEvent = new Event("keydown");
    cKeyEvent.key = 'c';
    const threeKeyEvent = new Event("keydown");
    threeKeyEvent.key = '3';
    const handleKeyButton = (e) => {
        switch(e.target.value) {
            case 'intense': {
                document.dispatchEvent(zKeyEvent);
                break;
            }
            case 'resume': {
                document.dispatchEvent(fKeyEvent);
                break;
            }
            case 'aftercare': {
                document.dispatchEvent(kKeyEvent);
                break;
            }
            case 'skipMco': {
                document.dispatchEvent(cKeyEvent);
                break;
            }
            case 'skipAftercare': {
                document.dispatchEvent(threeKeyEvent);
                break;
            }
            default: {
                break;
            }
        }
    }
    return(
        <div className="buttonsContainer">
            {intenseButton ? <Button className="intenseButton" value="intense" onClick={handleKeyButton}>Too Intense or Stop (z/Z)</Button>: <></>}
            {resumeButton ? <Button className="resumeButton" value="resume" onClick={handleKeyButton}>Resume (f/F)</Button>: <></>}
            {aftercareButton ? <Button className="aftercareButton" value="aftercare" onClick={handleKeyButton}>After Care (k/K)</Button>: <></>}
            {skipMcoButton ? <Button className="skipMcoButton" value="skipMco" onClick={handleKeyButton}>Press here to proceed</Button>: <></>}
            {skipAftercareButton ? <Button className="skipAftercareButton" value="skipAftercare" onClick={handleKeyButton}>Press here to proceed</Button>: <></>}
            
        </div>
    )
}