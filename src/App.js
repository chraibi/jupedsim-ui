import React, { useState } from "react";
import { Stage, Layer, Line, Rect, Circle } from "react-konva";

const App = () => {
    const SCALE = 50; // 1 meter = 50 pixels

    const [tool, setTool] = useState("geometry");
    const [geometry, setGeometry] = useState([]);
    const [exits, setExits] = useState([]);
    const [distributions, setDistributions] = useState([]);
    const [connections, setConnections] = useState([]);
    const [waypoints, setWaypoints] = useState([]);
    const [currentGeometryPoints, setCurrentGeometryPoints] = useState(null);
    const [currentConnectionPath, setCurrentConnectionPath] = useState(null);
    const [mousePosition, setMousePosition] = useState(null);
    const [currentRect, setCurrentRect] = useState(null);
    const generateIdw = () => `w-${Math.random().toString(36).substr(2, 9)}`;
    const generateIdd = () => `d-${Math.random().toString(36).substr(2, 9)}`;
    const generateIde = () => `e-${Math.random().toString(36).substr(2, 9)}`;
    const generateIdg = () => `g-${Math.random().toString(36).substr(2, 9)}`;

    const handleMouseDown = (e) => {
        const pos = e.target.getStage().getPointerPosition();
        const scaledPos = { x: pos.x / SCALE, y: pos.y / SCALE };
        if (tool === "delete") {
            const elementToDelete = findElementByPoint(scaledPos.x, scaledPos.y);

            if (elementToDelete) {
                // Check and remove the element from its corresponding state
                if (elementToDelete.type === "geometry") {
                    setGeometry(geometry.filter((g) => g.id !== elementToDelete.id));
                } else if (elementToDelete.type === "waypoint") {
                    setWaypoints(waypoints.filter((w) => w.id !== elementToDelete.id));
                } else if (elementToDelete.type === "exit") {
                    setExits(exits.filter((e) => e.id !== elementToDelete.id));
                } else if (elementToDelete.type === "distribution") {
                    setDistributions(distributions.filter((d) => d.id !== elementToDelete.id));
                }
                setConnections(connections.filter((c) => c.from !== elementToDelete.id && c.to !== elementToDelete.id));
                
                
            }
            return; // Exit early to avoid other tool behaviors
        }
        if (tool === "geometry") {
            if (!currentGeometryPoints) {
                // Start a new geometry shape
                setCurrentGeometryPoints([scaledPos.x, scaledPos.y]);
            } else {
                // Add new points to the geometry
                setCurrentGeometryPoints([...currentGeometryPoints, scaledPos.x, scaledPos.y]);
            }
        } else if (tool === "waypoint") {
            setWaypoints([...waypoints, { id: generateIdw(), x: scaledPos.x, y: scaledPos.y, radius: 0.2 }]);
        } else if (tool === "exit" || tool === "distribution") {
            const rect = { x: scaledPos.x - 0.5, y: scaledPos.y - 0.2, width: 1, height: 0.4 };
            if (tool === "exit") setExits([...exits, { id: generateIde(), ...rect }]);
            if (tool === "distribution")
                if (!currentRect) {
                    // Start drawing the rectangle
                    setCurrentRect({ x: scaledPos.x, y: scaledPos.y, width: 0, height: 0 });
                } else {
                    // Finalize the rectangle
                    const rect = {
                        x: Math.min(currentRect.x, scaledPos.x),
                        y: Math.min(currentRect.y, scaledPos.y),
                        width: Math.abs(scaledPos.x - currentRect.x),
                        height: Math.abs(scaledPos.y - currentRect.y),
                    };
                    setDistributions([...distributions, { id: generateIdd(), ...rect }]);
                    setCurrentRect(null); // Reset for the next rectangle
                }
        } else if (tool === "connection") {
                const clickedElement = findElementByPoint(scaledPos.x, scaledPos.y);

                if (!clickedElement) {
                    console.log("No element found at the clicked position.");
                    return;
                }

                if (!currentConnectionPath) {
                    // Start a new connection
                    setCurrentConnectionPath({ id: clickedElement.id, x: clickedElement.x, y: clickedElement.y });
                } else {
                    // Complete the connection
                    const startElement = currentConnectionPath;
                    const endElement = clickedElement;

                    if (startElement.id === endElement.id) {
                        console.error("Cannot connect an element to itself.");
                        setCurrentConnectionPath(null);
                        return;
                    }

                    // Add the new connection
                    setConnections([
                        ...connections,
                        {
                            from: startElement.id,
                            to: endElement.id,
                            points: [
                                startElement.x * SCALE,
                                startElement.y * SCALE,
                                endElement.x * SCALE,
                                endElement.y * SCALE,
                            ],
                        },
                    ]);
                    setCurrentConnectionPath(null); // Reset for the next connection
                }
            }

    };

    const handleMouseMove = (e) => {
        const pos = e.target.getStage().getPointerPosition();
        const scaledPos = { x: pos.x / SCALE, y: pos.y / SCALE };
        if (tool === "distribution" && currentRect) {
            // Update the rectangle dynamically
            setCurrentRect({
                x: currentRect.x,
                y: currentRect.y,
                width: scaledPos.x - currentRect.x,
                height: scaledPos.y - currentRect.y,
            });
        }
        if (tool === "connection" && currentConnectionPath) {
            setCurrentConnectionPath({
                ...currentConnectionPath,
                tempX: scaledPos.x * SCALE,
                tempY: scaledPos.y * SCALE,
            });
        }

        setMousePosition(scaledPos); // Update only the mouse position
    };
    const handleDoubleClick = () => {
        if (tool === "geometry" && currentGeometryPoints) {
            if (currentGeometryPoints.length >= 4) {
                // Save the completed polygon
                setGeometry([
                    ...geometry,
                    { id: generateIdg(), points: currentGeometryPoints },
                ]);
            }
            // Reset the state for the next shape
            setCurrentGeometryPoints(null);
            setMousePosition(null);
        }
    };

    
    const isPointOnLineSegment = (px, py, x1, y1, x2, y2, tolerance = 0.1) => {
        const distance = Math.abs(
            (y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1
        ) / Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);

        // Check if the point is within tolerance of the line and within segment bounds
        return distance <= tolerance &&
            px >= Math.min(x1, x2) && px <= Math.max(x1, x2) &&
            py >= Math.min(y1, y2) && py <= Math.max(y1, y2);
    };
    const isPointInPolygon = (x, y, polygonPoints) => {
        let isInside = false;
        const n = polygonPoints.length;

        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = polygonPoints[i][0], yi = polygonPoints[i][1];
            const xj = polygonPoints[j][0], yj = polygonPoints[j][1];

            const intersect =
                  yi > y !== yj > y &&
                  x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

            if (intersect) isInside = !isInside;
        }

        return isInside;
    };

    const findElementByPoint = (x, y) => {
        for (const g of geometry) {
            if (isPointInPolygon(x, y, g.points)) {
                return { id: g.id, type: "geometry", x: x, y: y }; // x and y as clicked position
            }
        }

        for (const w of waypoints) {
            if (isPointInCircle(x, y, w.x, w.y, w.radius)) {
                return { id: w.id, type: "waypoint", x: w.x, y: w.y };
            }
        }

        for (const rect of exits) {
            if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
                return { id: rect.id, type: "exit", x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            }
        }

        for (const rect of distributions) {
            if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
                return { id: rect.id, type: "distribution", x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            }
        }

        return null;
    };


    const isPointInCircle = (x, y, cx, cy, radius) => {
        const distanceSquared = (x - cx) ** 2 + (y - cy) ** 2;
        return distanceSquared <= radius ** 2;
    };

    const exportData = () => {
        const data = {
            geometry: geometry.map((g) => ({ id: g.id, points: g.points })),
            waypoints: waypoints.map((w) => ({ id: w.id, x: w.x, y: w.y, radius: w.radius })),
            exits: exits.map((e) => ({ id: e.id, x: e.x, y: e.y, width: e.width, height: e.height })),
            distributions: distributions.map((d) => ({ id: d.id, x: d.x, y: d.y, width: d.width, height: d.height })),
            connections: connections.map((c) => ({ from: c.from, to: c.to, points: c.points })),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "simulation_data.json";
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
            <div style={{ flex: 1, padding: "20px", backgroundColor: "#f4f4f9" }}>
                <h2>Simulation Setup</h2>
                <button onClick={() => setTool("geometry")}>Geometry Tool</button>
                <button onClick={() => setTool("waypoint")}>Waypoint Tool</button>
                <button onClick={() => setTool("exit")}>Exit Tool</button>
                <button onClick={() => setTool("distribution")}>Distribution Tool</button>
                <button onClick={() => setTool("connection")}>Connection Tool</button>
                <button onClick={() => setTool("delete")}>Delete Tool</button>
                <button onClick={exportData} style={{ backgroundColor: "#4CAF50", color: "white" }}>
                    Export Data
                </button>
                <p><strong>Current Tool:</strong> {tool}</p>
                {mousePosition && (
                    <p>
                        <strong>Mouse Position:</strong> ({mousePosition.x.toFixed(2)} m, {mousePosition.y.toFixed(2)} m)
                    </p>
                )}
            </div>

            <div style={{ flex: 3 }}>
                <Stage
                    width={window.innerWidth * 0.75}
                    height={window.innerHeight}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onDblClick={handleDoubleClick}
                    style={{ background: "#ddd" }}
                >
                    <Layer>
                        {currentRect && (
                            <Rect
                                x={currentRect.x * SCALE}
                                y={currentRect.y * SCALE}
                                width={currentRect.width * SCALE}
                                height={currentRect.height * SCALE}
                                stroke="orange"
                                strokeWidth={2}
                                dash={[10, 5]}
                                fill="rgba(255, 165, 0, 0.2)"
                            />
                        )}
                        {/* Render Completed Geometry */}
                        {geometry.map((polygon, i) => (
                            <Line
                                key={`geo-${i}`}
                                points={polygon.points.map((p) => p * SCALE)}
                                stroke="blue"
                                strokeWidth={2}
                                closed
                                fill="rgba(0, 0, 255, 0.2)"
                            />
                        ))}

                        {/* Render Current Geometry */}
                        {currentGeometryPoints && (
                            <>
                                <Line
                                    points={currentGeometryPoints.flatMap((p, i) =>
                                        i % 2 === 0 ? [p * SCALE, currentGeometryPoints[i + 1] * SCALE] : []
                                    )}
                                    stroke="blue"
                                    strokeWidth={2}
                                    closed={false}
                                />
                                {mousePosition && (
                                    <Line
                                        points={[
                                            currentGeometryPoints[currentGeometryPoints.length - 2] * SCALE,
                                            currentGeometryPoints[currentGeometryPoints.length - 1] * SCALE,
                                            mousePosition.x * SCALE,
                                            mousePosition.y * SCALE,
                                        ]}
                                        stroke="red"
                                        strokeWidth={2}
                                        dash={[10, 5]}
                                        closed={false}
                                    />
                                )}
                            </>
                        )}

                        {/* Render Other Elements */}
                        {waypoints.map((w, i) => (
                            <Circle key={`wp-${i}`} x={w.x * SCALE} y={w.y * SCALE} radius={w.radius * SCALE} fill="purple" />
                        ))}
                        {exits.map((e, i) => (
                            <Rect
                                key={`exit-${i}`}
                                x={e.x * SCALE}
                                y={e.y * SCALE}
                                width={e.width * SCALE}
                                height={e.height * SCALE}
                                stroke="green"
                                strokeWidth={2}
                                fill="rgba(0, 255, 0, 0.2)"
                            />
                        ))}
                        {distributions.map((d, i) => (
                            <Rect
                                key={`dist-${i}`}
                                x={d.x * SCALE}
                                y={d.y * SCALE}
                                width={d.width * SCALE}
                                height={d.height * SCALE}
                                stroke="orange"
                                strokeWidth={2}
                                fill="rgba(255, 165, 0, 0.2)"
                            />
                        ))}
                        {connections.map((c, i) => (
                            <Line
                                key={`conn-${i}`}
                                points={c.points}
                                stroke="red"
                                strokeWidth={2}
                                lineCap="round"
                                lineJoin="round"
                            />
                        ))}
                        {currentConnectionPath?.tempX && (
                            <Line
                                points={[
                                    currentConnectionPath.x * SCALE,
                                    currentConnectionPath.y * SCALE,
                                    currentConnectionPath.tempX,
                                    currentConnectionPath.tempY,
                                ]}
                                stroke="red"
                                strokeWidth={2}
                                dash={[10, 5]}
                            />
                        )}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
};

export default App;
