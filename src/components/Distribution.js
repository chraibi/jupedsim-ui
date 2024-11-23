import React from 'react';
import { Rect, Circle } from 'react-konva';

const Distribution = ({ distribution, dragHandlers,  updateConnections, config, onEdgeDrag }) => {
    const corners = [
        { x: distribution.x, y: distribution.y, edgeIndex: 0 }, // Top-left
    ];


    return (
        <>
            <Rect
                x={distribution.x * config.scale}
                y={distribution.y * config.scale}
                width={distribution.width * config.scale}
                height={distribution.height * config.scale}
                stroke="orange"
                strokeWidth={2}
                fill="rgba(255, 165, 0, 0.2)"
                draggable
                onDragStart={(e) => dragHandlers.onDragStart(e, { ...distribution, type: "Distribution" })}

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
                onDragEnd={(e) => dragHandlers.onDragEnd(e, { ...distribution, type: "Distribution"})}
            />
            
            {/* Render Corner Handles */}
            {corners.map((corner, i) => (
                <Circle
                    key={`corner-${i}`}
                    x={corner.x * config.scale}
                    y={corner.y * config.scale}
                    radius={5} // Handle size
                    fill="orange"
                    draggable
                    onDragMove={(e) => {
                        const pos = {
                            x: e.target.x() / config.scale,
                            y: e.target.y() / config.scale,
                        };
                        onEdgeDrag(pos, corner.edgeIndex, distribution.id, 'distribution'); // Pass corner drag info
                    }}
                />
            ))}
        </>
    );
};
export default Distribution;
