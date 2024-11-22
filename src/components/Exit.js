import React from 'react';
import { Rect, Circle } from 'react-konva';

const Exit = ({ exit, dragHandlers, updateConnections, config, onEdgeDrag }) => {

    const corners = [
        { x: exit.x, y: exit.y, edgeIndex: 0 }, // Top-left
    ];

    return (
        <>
            {/* Rectangle for Exit */}
            <Rect
                x={exit.x * config.scale}
                y={exit.y * config.scale}
                width={exit.width * config.scale}
                height={exit.height * config.scale}
                stroke="green"
                strokeWidth={2}
                fill="rgba(0, 255, 0, 0.2)"
                draggable
                onDragStart={(e) => dragHandlers.onDragStart(e, { ...exit, type: 'Exit' })}
                onDragMove={(e) => {
                    const pos = e.target.position();
                    const updatedExit = {
                        ...exit,
                        x: pos.x / config.scale,
                        y: pos.y / config.scale,
                    };
                    dragHandlers.onDragMove(e, updatedExit); // Update drag handler
                    updateConnections(updatedExit); // Update connections
                }}
                onDragEnd={(e) => dragHandlers.onDragEnd(e, { ...exit, type: 'Exit' })}
            />

            {/* Render Corner Handles */}
            {corners.map((corner, i) => (
                <Circle
                    key={`corner-${i}`}
                    x={corner.x * config.scale}
                    y={corner.y * config.scale}
                    radius={5} // Handle size
                    fill="green"
                    draggable
                    onDragMove={(e) => {
                        const pos = {
                            x: e.target.x() / config.scale,
                            y: e.target.y() / config.scale,
                        };
                        // const minDimension = 1; // Minimum allowed dimension
                        // // Constrain the x position of the left edge
                        // // Constrain the x position
                        // const constrainedX =
                        //     Math.min(
                        //         pos.x,
                        //         (exit.x + exit.width) / config.scale - minDimension // Ensure it doesn't shrink beyond the minimum width
                        //     )
                        // );

                        // // Constrain the y position
                        // const constrainedY = Math.max(
                        //     exit.y / config.scale, // Ensure it doesn't move above the rectangle's top edge
                        //     Math.min(
                        //         pos.y,
                        //         (exit.y + exit.height) / config.scale - minDimension // Ensure it doesn't shrink beyond the minimum height
                        //     )
                        // );
                        //const updatedPoint = { x: constrainedX, y: constrainedY };
                        const updatedPoint = { x: pos.x, y: pos.y };
                        onEdgeDrag(updatedPoint, corner.edgeIndex, exit.id, 'exit'); // Pass corner drag info
                    }}
                />
            ))}
        </>
    );
};

export default Exit;
