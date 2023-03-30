import { createContext, useContext, useReducer } from 'react';

const SliderContext = createContext(null);

const SliderDispatchContext = createContext(null);

/** Manages state for range slider below chat window */

export function SliderProvider({ children }) {
  const [slider, dispatch] = useReducer(
    sliderReducer,
    initialSlider
  );

  return (
    <SliderContext.Provider value={slider}>
      <SliderDispatchContext.Provider value={dispatch}>
        {children}
      </SliderDispatchContext.Provider>
    </SliderContext.Provider>
  );
}

export function useSlider() {
  return useContext(SliderContext);
}

export function useSliderDispatch() {
  return useContext(SliderDispatchContext);
}


  
function sliderReducer(state, action) {
  switch (action.type) {
    case 'changed': {
        return {
          sliderValue: action.sliderValue
        };
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

const initialSlider = { sliderValue: 5 };
