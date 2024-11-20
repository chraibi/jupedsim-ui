import { useState, useEffect } from 'react';

const useDragHandlers = (initialPosition = { x: 0, y: 0 }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);

  const startDrag = (event) => {
    setIsDragging(true);
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const handleDrag = (event) => {
    if (isDragging) {
      setPosition((prev) => ({
        x: prev.x + event.movementX,
        y: prev.y + event.movementY,
      }));
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', stopDrag);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, [isDragging]);

  return {
    position,
    startDrag,
    stopDrag,
  };
};

export default useDragHandlers;
