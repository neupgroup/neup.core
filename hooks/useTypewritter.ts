
'use client';

import { useState, useEffect, useRef } from 'react';

export function useTypewriter(targetText: string, deleteSpeed = 50, typeSpeed = 70) {
  const [displayText, setDisplayText] = useState(targetText);
  const previousTextRef = useRef(targetText);
  const animationRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Clear any running timeouts from previous effects
    animationRef.current.forEach(clearTimeout);
    animationRef.current = [];

    const previousText = previousTextRef.current;
    
    if (previousText === targetText) {
      // If the text is already correct, do nothing.
      setDisplayText(targetText);
      return;
    }

    const prefix = 'Neup';
    let i = previousText.length;

    // Deletion Phase
    const deleteAnimation = () => {
      // Only delete if the text is longer than the "Neup" prefix
      if (i > prefix.length) {
        setDisplayText(previousText.slice(0, i - 1));
        i--;
        const timeoutId = setTimeout(deleteAnimation, deleteSpeed);
        animationRef.current.push(timeoutId);
      } else {
        // Once deletion is done (or if not needed), start typing
        typeAnimation();
      }
    };

    // Typing Phase
    const typeAnimation = () => {
      let j = prefix.length;
      // Start typing from the end of the "Neup" prefix
      setDisplayText(prefix);

      const type = () => {
        if (j < targetText.length) {
          setDisplayText(targetText.slice(0, j + 1));
          j++;
          const timeoutId = setTimeout(type, typeSpeed);
          animationRef.current.push(timeoutId);
        } else {
          // When typing is complete, update the reference for the next change
          previousTextRef.current = targetText;
        }
      };
      type();
    };

    // Start the animation sequence
    deleteAnimation();

    // Cleanup function to clear timeouts when the component unmounts or targetText changes
    return () => {
      animationRef.current.forEach(clearTimeout);
    };

  }, [targetText, deleteSpeed, typeSpeed]);

  return displayText;
}