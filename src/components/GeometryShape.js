import React from 'react';
import { Line } from 'react-konva';

const GeometryShape = ({ polygon, config }) => (
    <Line
        points={polygon.points.map((p) => p * config.scale)}
        stroke="blue"
        strokeWidth={2}
        closed
        fill="rgba(0, 0, 255, 0.2)"
    />
);

export default GeometryShape;
