import React, {useEffect} from 'react';
import Loading from './common/Loading';
import { useKeys, useKeysDispatch } from './KeysContext';


export default function SimpleMessage({steps, step, previousStep, triggerNextStep}) {
  const text = step.metadata.text;
    return (
        
      <div className="simpleMessage">
        {text}
      </div>
    );
  
}

