import './App.css';
import ChatPrototype from './components/ChatPrototype';
import { SliderProvider } from './components/SliderContext';
import { KeysProvider } from './components/KeysContext';
import { useReducer, useState, useEffect } from 'react';
import { chatReducer } from './components/chatReducer';
import Loading from './components/common/Loading';
import { GetSteps } from './components/GetSteps';

/**
 * Builds chatbot "steps" before chatbot initialization because steps cannot be added after init.
 * GetSteps contains logic for building steps dynamically from conversation files.
 * Steps are passed to the chatbot component as a prop.
 * This approach for setting steps to state was chosen after a lot of troubleshooting with React's rendering.
 */

function App() {
  const [ steps, setSteps] = useState(null);
    
  useEffect(()=> {
    if(steps===null) {
      GetSteps().then(gottenSteps => {
        setSteps(gottenSteps);
      })
    }
  })

  // if (steps === undefined) {
  //   return <Loading />;
  // }
  if(steps) {
    return (
      <SliderProvider>  
        <KeysProvider>  
          <div className="App">
            <ChatPrototype steps={steps} />
          </div>
        </KeysProvider>
      </SliderProvider>
    );
  } else {
    return <Loading />;
  }
}



export default App;
