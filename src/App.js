import React, { useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Circle } from "react-konva";

const App = () => {
    const SCALE = 50; // 1 meter = 50 pixels
    const GRID_SPACING = 50; // Grid line spacing in pixels
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
    const [currentExit, setCurrentExit] = useState(null);
    const [currentWaypoint, setCurrentWaypoint] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    // Esc key handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setTool(null);
                setCurrentGeometryPoints(null);
                setCurrentWaypoint(null);
                setCurrentRect(null);
                setCurrentExit(null);
                setCurrentConnectionPath(null);
                setMousePosition(null); // Clear any temporary positions
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        // Cleanup the event listener on component unmount
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);
    const handleMouseDown = (e) => {
        if (isDragging || !tool) return; // Skip if dragging an object
        const pos = e.target.getStage().getPointerPosition();
        const scaledPos = { x: pos.x / SCALE, y: pos.y / SCALE };

        if (tool === "delete") {
            const elementToDelete = findElementByPoint(scaledPos.x, scaledPos.y);
            if (elementToDelete) {
                if (elementToDelete.type === "geometry") {
                    setGeometry(geometry.filter((g) => g.id !== elementToDelete.id));
                } else if (elementToDelete.type === "waypoint") {
                    setWaypoints(waypoints.filter((w) => w.id !== elementToDelete.id));
                } else if (elementToDelete.type === "exit") {
                    setExits(exits.filter((e) => e.id !== elementToDelete.id));
                } else if (elementToDelete.type === "distribution") {
                    setDistributions(distributions.filter((d) => d.id !== elementToDelete.id));
                }
                setConnections(
                    connections.filter((c) => c.from !== elementToDelete.id && c.to !== elementToDelete.id)
                );
            }
            return;
        }
        if (tool === "geometry") {
            if (!currentGeometryPoints) {
                // Start a new geometry
                setCurrentGeometryPoints([scaledPos.x, scaledPos.y]);
            } else {
                // Add new points on click
                setCurrentGeometryPoints([...currentGeometryPoints, scaledPos.x, scaledPos.y]);
            }
        }
        else if (tool === "waypoint") {
            if (!currentWaypoint) {
                setCurrentWaypoint({ x: scaledPos.x, y: scaledPos.y, radius: 0 });
            } else {
                const radius = Math.sqrt(
                    (scaledPos.x - currentWaypoint.x) ** 2 + (scaledPos.y - currentWaypoint.y) ** 2
                );
                setWaypoints([
                    ...waypoints,
                    { id: generateId("w"), x: currentWaypoint.x, y: currentWaypoint.y, radius },
                ]);
                setCurrentWaypoint(null);
            }
        } else if (tool === "exit") {
            if (!currentExit) {
                setCurrentExit({ x: scaledPos.x, y: scaledPos.y, width: 0, height: 0 });
            } else {
                const rect = {
                    x: Math.min(currentExit.x, scaledPos.x),
                    y: Math.min(currentExit.y, scaledPos.y),
                    width: Math.abs(scaledPos.x - currentExit.x),
                    height: Math.abs(scaledPos.y - currentExit.y),
                };
                setExits([...exits, { id: generateId("e"), ...rect }]);
                setCurrentExit(null);
            }
        } else if (tool === "distribution") {
            if (!currentRect) {
                setCurrentRect({ x: scaledPos.x, y: scaledPos.y, width: 0, height: 0 });
            } else {
                const rect = {
                    x: Math.min(currentRect.x, scaledPos.x),
                    y: Math.min(currentRect.y, scaledPos.y),
                    width: Math.abs(scaledPos.x - currentRect.x),
                    height: Math.abs(scaledPos.y - currentRect.y),
                };
                setDistributions([...distributions, { id: generateId("d"), ...rect }]);
                setCurrentRect(null);
            }
        } else if (tool === "connection") {
            const clickedElement = findElementByPoint(scaledPos.x, scaledPos.y);
            if (!clickedElement) return;
            if (!currentConnectionPath) {
                setCurrentConnectionPath({ id: clickedElement.id, x: clickedElement.x, y: clickedElement.y });
            } else {
                const startElement = currentConnectionPath;
                const endElement = clickedElement;
                if (startElement.id !== endElement.id) {
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
                }
                setCurrentConnectionPath(null);
            }
        }
    };

    const handleMouseMove = (e) => {
        const pos = e.target.getStage().getPointerPosition();
        const scaledPos = { x: pos.x / SCALE, y: pos.y / SCALE };
        setMousePosition(scaledPos);
        if (tool === "geometry" && currentGeometryPoints) {
            // Only update mousePosition for the dashed line
            setMousePosition(scaledPos);
        }

        

        if (tool === "waypoint" && currentWaypoint) {
            const radius = Math.sqrt(
                (scaledPos.x - currentWaypoint.x) ** 2 + (scaledPos.y - currentWaypoint.y) ** 2
            );
            setCurrentWaypoint({ ...currentWaypoint, radius });
        }

        if (tool === "exit" && currentExit) {
            setCurrentExit({
                x: currentExit.x,
                y: currentExit.y,
                width: scaledPos.x - currentExit.x,
                height: scaledPos.y - currentExit.y,
            });
        }

        if (tool === "distribution" && currentRect) {
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
    };

    
    const handleDoubleClick = () => {
        if (tool === "geometry" && currentGeometryPoints) {
            if (currentGeometryPoints.length >= 4) {
                // Save the finalized polygon
                setGeometry([
                    ...geometry,
                    { id: generateId("g"), points: currentGeometryPoints },
                ]);
            }
            setCurrentGeometryPoints(null); // Reset for the next shape
            setMousePosition(null); // Clear the dashed line
        }
    };

    const findElementByPoint = (x, y) => {
        for (const w of waypoints) {
            if (isPointInCircle(x, y, w.x, w.y, w.radius)) return { id: w.id, type: "waypoint", x: w.x, y: w.y };
        }
        for (const e of exits) {
            const centerX = e.x + e.width / 2;
            const centerY = e.y + e.height / 2;
            if (x >= e.x && x <= e.x + e.width && y >= e.y && y <= e.y + e.height) {
                return { id: e.id, type: "exit", x: centerX, y: centerY };
            }
        }
        for (const d of distributions) {
            const centerX = d.x + d.width / 2;
            const centerY = d.y + d.height / 2;
            if (x >= d.x && x <= d.x + d.width && y >= d.y && y <= d.y + d.height) {
                return { id: d.id, type: "distribution", x: centerX, y: centerY };
            }
        }
        return null;
    };

    const isPointInPolygon = (x, y, points) => {
        let isInside = false;
        const n = points.length / 2;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = points[i * 2];
            const yi = points[i * 2 + 1];
            const xj = points[j * 2];
            const yj = points[j * 2 + 1];
            const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) isInside = !isInside;
        }
        return isInside;
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




    const renderGrid = () => {
        const lines = [];
        const width = window.innerWidth * 0.75; // Adjust for canvas size
        const height = window.innerHeight;

        // Vertical lines
        for (let x = 0; x <= width; x += GRID_SPACING) {
            lines.push(
                <Line
                    key={`v-${x}`}
                    points={[x, 0, x, height]}
                    stroke="#8d8d8d"
                    strokeWidth={1}
                />
            );
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += GRID_SPACING) {
            lines.push(
                <Line
                    key={`h-${y}`}
                    points={[0, y, width, y]}
                    stroke="#8d8d8d"
                    strokeWidth={1}
                />
            );
        }

        return lines;
    };


    const updateConnections = (updatedElement) => {
        const updatedConnections = connections.map((c) => {
            if (c.from === updatedElement.id) {
                // Update the source point
                const sourceX =
                      updatedElement.x * SCALE +
                      (updatedElement.width ? (updatedElement.width / 2) * SCALE : 0);
                const sourceY =
                      updatedElement.y * SCALE +
                      (updatedElement.height ? (updatedElement.height / 2) * SCALE : 0);
                return {
                    ...c,
                    points: [sourceX, sourceY, c.points[2], c.points[3]],
                };
            } else if (c.to === updatedElement.id) {
                // Update the destination point
                const targetX =
                      updatedElement.x * SCALE +
                      (updatedElement.width ? (updatedElement.width / 2) * SCALE : 0);
                const targetY =
                      updatedElement.y * SCALE +
                      (updatedElement.height ? (updatedElement.height / 2) * SCALE : 0);
                return {
                    ...c,
                    points: [c.points[0], c.points[1], targetX, targetY],
                };
            }
            return c;
        });

        setConnections(updatedConnections);
    };
    const handleDrag = (updatedElement, i, setElements, elements, e) => {
        const pos = e.target.position();
        const scaledPos = { x: pos.x / SCALE, y: pos.y / SCALE };
        const updatedObject = { ...updatedElement, x: scaledPos.x, y: scaledPos.y };
        setElements(
            elements.map((element, index) =>
                index === i ? updatedObject : element
            )
        );
        updateConnections(updatedObject);
    };
    const exitsDragHandlers = {
        onDragStart: () => setIsDragging(true),
        onDragMove: (e, i) => {
            setIsDragging(true);
            handleDrag(exits[i], i, setExits, exits, e);
        },
        onDragEnd: (e, i) => {
            setIsDragging(false);
            handleDrag(exits[i], i, setExits, exits, e);
        },
    };

    const distributionsDragHandlers = {
        onDragStart: () => setIsDragging(true),
        onDragMove: (e, i) => {
            setIsDragging(true);
            handleDrag(distributions[i], i, setDistributions, distributions, e);
        },
        onDragEnd: (e, i) => {
            setIsDragging(false);
            handleDrag(distributions[i], i, setDistributions, distributions, e);
        },
    };

    const waypointsDragHandlers = {
        onDragStart: () => setIsDragging(true), // Set dragging flag
        onDragMove: (e, i) => {
            setIsDragging(true); // Reset dragging flag
            handleDrag(waypoints[i], i, setWaypoints, waypoints, e);
        },
        onDragEnd: (e, i) => {
            setIsDragging(false); // Reset dragging flag
            handleDrag(waypoints[i], i, setWaypoints, waypoints, e);
        },
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
                <button onClick={() => setShowGrid(!showGrid)}> {showGrid ? "Hide Grid": "Show Gird"}  </button>
                <button onClick={exportData} style={{ backgroundColor: "#4CAF50", color: "white" }}>
                    Export Data
                </button>
                <p><strong>Current Tool:</strong> {tool || "None"}</p>
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
                        {showGrid && renderGrid()}                        

                        {/* Geometry */}
                        
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

                        {/* Current Geometry */}
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
                        {/* Waypoints */}
                        {waypoints.map((w, i) => (
                            <Circle
                                key={`wp-${i}`}
                                x={w.x * SCALE}
                                y={w.y * SCALE}
                                radius={w.radius * SCALE}
                                fill="purple"
                                draggable
                                onDragStart={waypointsDragHandlers.onDragStart}
                                onDragMove={(e) => {
                                    const pos = e.target.position();
                                    const scaledPos = { x: pos.x / SCALE, y: pos.y / SCALE };
                                    const updatedWaypoint = { ...w, x: scaledPos.x, y: scaledPos.y };

                                    // Update the waypoint position
                                    setWaypoints(
                                        waypoints.map((wp, index) =>
                                            index === i ? updatedWaypoint : wp
                                        )
                                    );

                                    // Update connections live
                                    updateConnections(updatedWaypoint);
                                }}
                                onDragEnd={(e) => waypointsDragHandlers.onDragEnd(e, i)}
                            />
                        ))}

                        {/* Current Waypoint */}
                        {currentWaypoint && (
                            <Circle
                                x={currentWaypoint.x * SCALE}
                                y={currentWaypoint.y * SCALE}
                                radius={currentWaypoint.radius * SCALE}
                                stroke="purple"
                                strokeWidth={2}
                                dash={[10, 5]}
                                fill="rgba(128, 0, 128, 0.2)"
                            />
                        )}

                        {/* Exits */}
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
                                draggable
                                onDragStart={() => setIsDragging(true)}
                                onDragMove={(e) => exitsDragHandlers.onDragMove(e, i)}
                                onDragEnd={(e) => exitsDragHandlers.onDragEnd(e, i)}
                                
                            />
                        ))}

                        {/* Current Exit */}
                        {currentExit && (
                            <Rect
                                x={currentExit.x * SCALE}
                                y={currentExit.y * SCALE}
                                width={currentExit.width * SCALE}
                                height={currentExit.height * SCALE}
                                stroke="green"
                                strokeWidth={2}
                                dash={[10, 5]}
                                fill="rgba(0, 255, 0, 0.2)"
                            />
                        )}

                        {/* Distributions */}
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
                                draggable
                                onDragStart={() => setIsDragging(true)}
                                onDragMove={(e) => distributionsDragHandlers.onDragMove(e, i)}
                                onDragEnd={(e) => distributionsDragHandlers.onDragEnd(e, i)}
                            />
                        ))}

                        {/* Current Distribution */}
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

                        {/* Connections */}
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
