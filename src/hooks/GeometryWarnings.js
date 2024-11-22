import React, { useState, useEffect } from "react";
import { isPointInPolygon } from "../utils/geometryUtils";
//var pointInPolygon = require("point-in-polygon");

const extractGeometryPoints = (geometry) => {
    if (!geometry || geometry.length === 0) return [];
    return geometry.map((geo) => {
        const points = [];
        for (let i = 0; i < geo.points.length; i += 2) {
            points.push([geo.points[i], geo.points[i + 1]]);
        }
        return points;
    });
};

const isInsideAnyGeometry = (object, geometries) => {
    return geometries.some((polygon) => {
        //console.log("Checking polygon:", polygon);
        const result = isPointInPolygon(object.x, object.y, polygon);
        //const result = pointInPolygon([object.x, object.y], polygon);
        return result;
    });
};

const checkObjectWarning = (object, type, geometries) => {
    if (!isInsideAnyGeometry(object, geometries)) {
        return `${type} ${object.id} is outside all geometries.`;
    }
    return null;
};

const GeometryWarnings = ({
    waypoints = [],
    exits = [],
    distributions = [],
    geometry = [],
    isDragging = false,
    draggedItem = null,
}) => {
    const [warnings, setWarnings] = useState([]);

    const updateWarnings = () => {
        const newWarnings = [];
        const allGeometryPoints = extractGeometryPoints(geometry);

        const checkAllObjects = (items, type) => {
            items.forEach((item) => {
                const warning = checkObjectWarning(item, type, allGeometryPoints);
                if (warning) newWarnings.push(warning);
            });
        };
        console.log("isDragging")
        console.log(isDragging)
        console.log("DraggedItem")
        console.log(draggedItem)
        if (isDragging && draggedItem) {
            console.log(draggedItem)
            // Exclude the dragged item from warnings
            checkAllObjects(
                waypoints.filter((wp) => wp.id !== draggedItem.id || draggedItem.type !== "waypoint"),
                "Waypoint"
            );
            checkAllObjects(
                exits.filter((ex) => ex.id !== draggedItem.id || draggedItem.type !== "exit"),
                "Exit"
            );
            checkAllObjects(
                distributions.filter((dist) => dist.id !== draggedItem.id || draggedItem.type !== "distribution"),
                "Distribution"
            );

            // Add a warning for the dragged item if it's outside
            const draggedWarning = checkObjectWarning(draggedItem, draggedItem.type, allGeometryPoints);
            if (draggedWarning) newWarnings.push(draggedWarning);
        } else {
            // Check all objects when not dragging
            checkAllObjects(waypoints, "Waypoint");
            checkAllObjects(exits, "Exit");
            checkAllObjects(distributions, "Distribution");
        }

        setWarnings(newWarnings);
    };

    useEffect(() => {

        updateWarnings();
    }, [waypoints, exits, distributions, geometry, isDragging, draggedItem]);

    if (warnings.length === 0) return null;

    return (
        <div style={{ position: "fixed", bottom: "10px", right: "10px", zIndex: 1000 }}>
            <div
                style={{
                    background: "#ffe6e6",
                    color: "#ff0000",
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ffcccc",
                    maxWidth: "300px",
                }}
            >
                <strong>Warnings:</strong>
                <ul style={{ margin: 0, padding: "5px 0 0 15px" }}>
                    {warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default GeometryWarnings;
