import { createContext, useContext, useReducer } from 'react';

export const KeysContext = createContext(null);

export const KeysDispatchContext = createContext(null);

/** Manages state for key command events */

export function KeysProvider({ children }) {
  const [keys, keysDispatch] = useReducer(
    KeysReducer,
    initialKeys
  );
  

  return (
    <KeysContext.Provider value={keys}>
      <KeysDispatchContext.Provider value={keysDispatch}>
        {children}
      </KeysDispatchContext.Provider>
    </KeysContext.Provider>
  );
}

export function useKeys() {
  return useContext(KeysContext);
}

export function useKeysDispatch() {
  return useContext(KeysDispatchContext);
}
  
function KeysReducer(state, action) {
  switch (action.type) {
    case 'change': {
      return {
        intenseButton: action.intenseButton,
        resumeButton: action.resumeButton,
        aftercareButton: action.aftercareButton,
        skipMcoButton: action.skipMcoButton,
        skipAftercareButton: action.skipAftercareButton,
      }
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

const initialKeys = { 
    intenseButton: false,
    resumeButton: false,
    aftercareButton: false,
    // skipSustainedButton: false,
    skipMcoButton: false,
    skipAftercareButton: false,
};
