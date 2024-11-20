import React from 'react';
import { Rect } from 'react-konva';

const Distribution = ({ distribution, dragHandlers,  updateConnections, config }) => (
      <Rect
        x={distribution.x * config.scale}
        y={distribution.y * config.scale}
        width={distribution.width * config.scale}
        height={distribution.height * config.scale}
        stroke="orange"
        strokeWidth={2}
        fill="rgba(255, 165, 0, 0.2)"
        draggable
        onDragStart={dragHandlers.onDragStart}
        onDragMove={(e) => {
            const pos = e.target.position();
            const updatedDistribution = {
                ...distribution,
                x: pos.x / config.scale,
                y: pos.y / config.scale,
            };
            dragHandlers.onDragMove(e, updatedDistribution); // Update state
            updateConnections(updatedDistribution); // Update connections
        }}
        onDragEnd={(e) => dragHandlers.onDragEnd(e, distribution.id)}
    />
);

export default Distribution;
