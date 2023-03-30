import React from 'react';

export default function NameResponse ({steps, step, previousStep, triggerNextStep}) {
  let sentence = '';
  const text = step.metadata.text;
  let name = previousStep.value;
  name = name.charAt(0).toUpperCase() + name.slice(1);
  for(let li=0; li < text.length; li++) {
    let line = text[li]['text'];
    sentence = sentence.concat(line.replace('<name>', name));
  }
    return (
        
      <div className="nameResponse">
        {sentence}
      </div>
    );
  
}
