import React, { useEffect, useState } from 'react';
import { useKeys, useKeysDispatch } from './KeysContext';
const ALLOWED_KEYS= ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

/** Handles key up js events */

const KeyDownFunctional = () => {
    const [pressedKeys, setPressedKeys] = useState([]);
    
    const keysDispatch = useKeysDispatch();
    useEffect(() => {
        const onKeyDown = ({key}) => {
            setPressedKeys(previousPressedKeys => [...previousPressedKeys, key]);
            keysDispatch({
                type: 'end'
            })
        }
    
        const onKeyUp = ({key}) => {
            setPressedKeys(previousPressedKeys => previousPressedKeys.filter(k => k !== key));
        }

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

export default KeyDownFunctional;