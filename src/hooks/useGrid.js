import React from "react";
import { Line } from "react-konva";

const useGrid = (config) => {
  const renderGrid = () => {
    const lines = [];
    const width = window.innerWidth * 0.75; // Adjust for canvas size
    const height = window.innerHeight;

    // Vertical lines
    for (let x = 0; x <= width; x += config.gridSpacing) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke="#b3b3b3"
          strokeWidth={1}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += config.gridSpacing) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke="#b3b3b3"
          strokeWidth={1}
        />
      );
    }

    return lines;
  };

  return { renderGrid };
};

export default useGrid;
