import React from 'react';
import { Rect } from 'react-konva';

const Exit = ({ exit, dragHandlers,  updateConnections, config }) => (
     <Rect
        x={exit.x * config.scale}
        y={exit.y * config.scale}
        width={exit.width * config.scale}
        height={exit.height * config.scale}
        stroke="green"
        strokeWidth={2}
        fill="rgba(0, 255, 0, 0.2)"
        draggable
        onDragStart={dragHandlers.onDragStart}
        onDragMove={(e) => {
            const pos = e.target.position();
            const updatedExit = {
                ...exit,
                x: pos.x / config.scale,
                y: pos.y / config.scale,
            };
            dragHandlers.onDragMove(e, updatedExit); // Update state
            updateConnections(updatedExit); // Update connections
        }}
        onDragEnd={(e) => dragHandlers.onDragEnd(e, exit.id)}
    />
);

export default Exit;
