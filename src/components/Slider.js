import React, { useState, useReducer } from 'react';
import '../Slider.css';
import { useSlider, useSliderDispatch } from './SliderContext';

export default function Slider({ min, max, step}) {
    const slider = useSlider();
    const sliderDispatch = useSliderDispatch();

    const handleChange = (e) => {
        const { value } = e.target;
        sliderDispatch({ type: 'changed', sliderValue: value })
    };
    return(
        <div className="slidecontainer">
            <input 
                type="range"
                min={min}
                max={max}
                step={step}
                onChange={handleChange}
                value={slider.sliderValue}
                className="slider" 
                id="myRange"
            />
            <div>Delay: {slider.sliderValue} Seconds</div>
        </div>
    )
}

