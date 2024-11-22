import React from "react";
import { Line, Circle } from "react-konva";

const GeometryShape = ({ polygon, config, onEdgeDrag }) => {
    const { points } = polygon;

    const edgeMidpoints = points.reduce((acc, _, index) => {
        if (index % 2 === 0) {
            const x1 = points[index];
            const y1 = points[index + 1];
            const x2 = points[(index + 2) % points.length];
            const y2 = points[(index + 3) % points.length];
            const midX = (x1 + x1) / 2;
            const midY = (y1 + y1) / 2;
            acc.push({ x: midX, y: midY, edgeIndex: index });
        }
        return acc;
    }, []);

    return (
        <>
            <Line
                points={points.map((p) => p * config.scale)}
                stroke="blue"
                strokeWidth={2}
                closed
                fill="rgba(0, 0, 255, 0.2)"
            />
            {/* Render Edge Handles */}
            {edgeMidpoints.map((midpoint, i) => (
                <Circle
                    key={i}
                    x={midpoint.x * config.scale}
                    y={midpoint.y * config.scale}
                    radius={5} // Small draggable handle
                    fill="blue"
                    draggable
                    onDragMove={(e) => {
                        const pos = {
                            x: e.target.x() / config.scale,
                            y: e.target.y() / config.scale,
                        };
                        onEdgeDrag(pos, midpoint.edgeIndex, polygon.id, "geometry");
                    }}
                />
            ))}
        </>
    );
};

export default GeometryShape;
