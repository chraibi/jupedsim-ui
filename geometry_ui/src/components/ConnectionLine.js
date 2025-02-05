import React from 'react';
import { Line } from 'react-konva';

const ConnectionLine = ({ connection, config }) => {
    return (
        <Line
            points={connection.points}
            stroke="red"
            strokeWidth={2}
            lineCap="round"
            lineJoin="round"
        />
    );
};

export default ConnectionLine;
