import React from 'react';
import { Circle } from 'react-konva';

const Waypoint = ({ waypoint, dragHandlers,updateConnections, config }) => (
     <Circle
        x={waypoint.x * config.scale}
        y={waypoint.y * config.scale}
        radius={waypoint.radius * config.scale}
        fill="purple"
        draggable
         
         onDragStart={(e) => dragHandlers.onDragStart(e, { ...waypoint, type: "Waypoint" })}

        onDragMove={(e) => {
            const pos = e.target.position();
            const updatedWaypoint = {
                ...waypoint,
                x: pos.x / config.scale,
                y: pos.y / config.scale,
            };
            dragHandlers.onDragMove(e, updatedWaypoint); // Update state
            updateConnections(updatedWaypoint); // Update connections
        }}
         onDragEnd={(e) => dragHandlers.onDragEnd(e, {...waypoint, type: "Waypoint"})}
         />
);

export default Waypoint;
