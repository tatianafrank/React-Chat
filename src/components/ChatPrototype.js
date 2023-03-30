import React, { useEffect, useState } from 'react';
import ChatBot from '../lib/index';
import Slider from './Slider';
import { useSlider } from './SliderContext';
import Loading from '../lib/index';
import KeyButtons from './KeyButtons';


const config ={
    width: "500px",
    height: "500px",
  };
  
  /**
   * 
   * Inits chatbot with rendered steps and slider value for msg speed
   */
  export default function ChatPrototype({steps}) {
    const { sliderValue } = useSlider();

    if(steps===null || steps === undefined) {
      return (
        <Loading />
      )
    } 
    else {
      return (
        <div className='chatBotContainer'>
          <ChatBot 
           steps={steps}
          sliderValue={sliderValue*1000} 
          {...config}
          />
          <KeyButtons />
          <Slider 
          min={1}
          max={6}
          step={1}
          />
        </div>
      );  
    }
}
