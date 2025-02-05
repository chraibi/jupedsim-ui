
import React, { useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Circle } from "react-konva";
import ConfigPanel from './components/ConfigPanel';
import Header from './components/Header';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';


import GeometryWarnings from './hooks/GeometryWarnings';
import useGrid from "./hooks/useGrid";
//import useDragHandlers from "./hooks/useDragHandlers";
import { generateId, clamp } from './utils/idUtils';
import { isPointInPolygon, isPointInCircle, findNearestSnapPoint, findElementByPoint } from './utils/geometryUtils';
import { findAlignmentGuides } from './utils/snapUtils';
import useEscapeHandler from "./hooks/useEscapeHandler";
import './App.css';
import logo from './assets/logo.png';
const App = () => {
    const [config, setConfig] = useState({
        gridSpacing: 50,
        showGrid: true,
        scale: 50,
        showAlignmentGuides: false,
        snapThreshold: 10,
    });
    const { renderGrid } = useGrid(config);
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
    const [draggedItem, setDraggedItem] = useState(null);
    const [warnings, setWarnings] = useState(null);
    const [alignmentGuides, setAlignmentGuides] = useState({ x: null, y: null });




    
    useEscapeHandler({
        resetTool: () => setTool(null),
        resetGeometryPoints: () => setCurrentGeometryPoints(null),
        resetWaypoint: () => setCurrentWaypoint(null),
        resetRect: () => setCurrentRect(null),
        resetExit: () => setCurrentExit(null),
        resetConnectionPath: () => setCurrentConnectionPath(null),
        resetMousePosition: () => setMousePosition(null),
    });
    const handleMouseDown = (e) => {
        if (isDragging || !tool) return; // Skip if dragging an object
        const pos = e.target.getStage().getPointerPosition();
        const scaledPos = { x: pos.x / config.scale, y: pos.y / config.scale };

        if (tool === "delete") {
            const elementToDelete = findElementByPoint(scaledPos.x, scaledPos.y, geometry, waypoints, exits, distributions);
            if (elementToDelete) {
                if (elementToDelete.type === "waypoint") {
                    setWaypoints(waypoints.filter((w) => w.id !== elementToDelete.id));
                } else if (elementToDelete.type === "exit") {
                    setExits(exits.filter((e) => e.id !== elementToDelete.id));
                } else if (elementToDelete.type === "distribution") {
                    setDistributions(distributions.filter((d) => d.id !== elementToDelete.id));
                }
                if (elementToDelete.type === "geometry") {
                    setGeometry(geometry.filter((g) => g.id !== elementToDelete.id));
                } else
               
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
            const clickedElement = findElementByPoint(scaledPos.x, scaledPos.y, geometry, waypoints, exits, distributions);
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
                                startElement.x * config.scale,
                                startElement.y * config.scale,
                                endElement.x * config.scale,
                                endElement.y * config.scale,
                            ],
                        },
                    ]);
                }
                setCurrentConnectionPath(null);
            }
        }
    };
    const throttle = (func, limit) => {
        let lastFunc;
        let lastRan;
        return function (...args) {
            if (!lastRan) {
                func.apply(this, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if (Date.now() - lastRan >= limit) {
                        func.apply(this, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    };
    const throttledMouseMove = throttle((e) => {
        const pos = e.target.getStage().getPointerPosition();
        const scaledPos = { x: pos.x / config.scale, y: pos.y / config.scale };

        setMousePosition(scaledPos);

        if (tool === "geometry" && currentGeometryPoints) {
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
                tempX: scaledPos.x * config.scale,
                tempY: scaledPos.y * config.scale,
            });
        }
    }, 1000); // Throttle updates to every 50ms

    const handleMouseMove = (e) => throttledMouseMove(e);


    
    const handleMouseMove2 = (e) => {
        const pos = e.target.getStage().getPointerPosition();
        const scaledPos = { x: pos.x / config.scale, y: pos.y / config.scale };
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
                tempX: scaledPos.x * config.scale,
                tempY: scaledPos.y * config.scale,
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





    const updateConnections = (updatedElement) => {
        const updatedConnections = connections.map((c) => {
            if (c.from === updatedElement.id) {
                // Update the source point
                const sourceX =
                      updatedElement.x * config.scale +
                      (updatedElement.width ? (updatedElement.width / 2) * config.scale : 0);
                const sourceY =
                      updatedElement.y * config.scale +
                      (updatedElement.height ? (updatedElement.height / 2) * config.scale : 0);
                return {
                    ...c,
                    points: [sourceX, sourceY, c.points[2], c.points[3]],
                };
            } else if (c.to === updatedElement.id) {
                // Update the destination point
                const targetX =
                      updatedElement.x * config.scale +
                      (updatedElement.width ? (updatedElement.width / 2) * config.scale : 0);
                const targetY =
                      updatedElement.y * config.scale +
                      (updatedElement.height ? (updatedElement.height / 2) * config.scale : 0);
                return {
                    ...c,
                    points: [c.points[0], c.points[1], targetX, targetY],
                };
            }
            return c;
        });

        setConnections(updatedConnections);
    };

    const handleDragStart = (draggedElement) => {
        setIsDragging(true);
        setDraggedItem(draggedElement);
    };
    const handleDrag = (updatedElement, i, setElements, elements, e) => {
        const pos = e.target.position();
        let scaledPos = { x: pos.x / config.scale, y: pos.y / config.scale };
        scaledPos = findNearestSnapPoint(scaledPos, config);
        const updatedObject = { ...updatedElement, x: scaledPos.x, y: scaledPos.y };
        setElements(
            elements.map((element, index) =>
                index === i ? updatedObject : element
            )
        );


        // Update alignment guides
        if (config.showAlignmentGuides) {
            const guides = findAlignmentGuides(updatedObject, elements);
            setAlignmentGuides(guides); // Show guides dynamically
        }
        updateConnections(updatedObject);
    };
    
    const handleDragEnd = (e) => {
        setAlignmentGuides({ x: null, y: null }); // Clear guides
        setIsDragging(false);
        setDraggedItem(null);
    };

const createDragHandlers = (setElements, elements) => ({
    onDragStart: (e, element) => {
        setIsDragging(true);
        setDraggedItem(element); // Pass the complete element with type
    },
    onDragMove: (e, updatedElement) => {
        const { id } = updatedElement; // Use the updated element details
        setElements(
            elements.map((el) => (el.id === id ? updatedElement : el)) // Update position
        );
    },
    onDragEnd: (e, element) => {
        setIsDragging(false);
        setDraggedItem(null); // Reset dragged item
    },
});
   
    const exitsDragHandlers = createDragHandlers(setExits, exits, "exit");
    const distributionsDragHandlers = createDragHandlers(setDistributions, distributions, "distribution");
    const waypointsDragHandlers = createDragHandlers(setWaypoints, waypoints, "waypoint");

    const handleDragStage = (e) => {
        const pos = e.target.position();
        const width = window.innerWidth;
        const height = window.innerHeight;

        e.target.position({
            x: clamp(pos.x, -width, width),
            y: clamp(pos.y, -height, height),
        });
    };

    const handleEdgeDrag = (newPoint, edgeIndex, id, type) => {
        const minDimension = 1;
        if (type === "geometry") {
            setGeometry((prevGeometry) =>
                prevGeometry.map((polygon) => {
                    if (polygon.id === id) {
                        const updatedPoints = [...polygon.points];
                        // Update the start and end points of the dragged edge
                        updatedPoints[edgeIndex] = newPoint.x;
                        updatedPoints[edgeIndex + 1] = newPoint.y;
                        return { ...polygon, points: updatedPoints };
                    }
                    return polygon;
                })
            );
        } else if (type === "distribution") {
            setDistributions((prevDistributions) =>
                prevDistributions.map((distribution) => {
                    if (distribution.id === id) {
                        const { x, y, width, height } = distribution;
                        const updatedDistribution = { ...distribution };
                        // Adjust edges based on index
                        switch (edgeIndex) {
                        case 0: // Left edge
                            const newWidth = width + (x - newPoint.x);
                            if (newWidth > minDimension && newPoint.x <= x + width + 1) {
                                updatedDistribution.x = newPoint.x;
                                updatedDistribution.width = newWidth;
                            }                        
                            const newHeight = height + (y - newPoint.y);
                            if (newHeight > minDimension && newPoint.y <= y + height) {
                                updatedDistribution.y = newPoint.y;
                                updatedDistribution.height = newHeight;
                            }                        
                            break;
                            
                        default:
                            break;
                        }
                        return updatedDistribution;
                    }
                    return distribution;
                })
            );
        } else if (type === "exit") {
            setExits((prevExits) =>
                prevExits.map((exit) => {
                    if (exit.id === id) {
                        const { x, y, width, height } = exit;

                        const updatedExit = { ...exit };
                        // Adjust edges based on index
                        switch (edgeIndex) {
                        case 0: // Left edge
                            {
                                const newWidth = width + (x - newPoint.x);
                                if (newWidth > minDimension) {
                                    updatedExit.x = newPoint.x;
                                    updatedExit.width = newWidth;
                                }
                                const newHeight = height + (y - newPoint.y);
                                if (newHeight > minDimension) {
                                    updatedExit.y = newPoint.y;
                                    updatedExit.height = newHeight;
                                }
                            }
                            break;
                        default:
                            break;
                        }
                        return updatedExit;
                    }
                    return exit;
                })
            );
        }
    };


    
    return (
        <div style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
            {/* Sidebar ConfigPanel */}
            <ConfigPanel
                tool={tool}
                setTool={setTool}
                config={config}
                setConfig={setConfig}
                exportData={exportData}
                logo={logo}
            />
            
            {/* Main Content Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Toolbar above the Canvas */}
                <Toolbar
                    config={config}
                    setConfig={setConfig}
                    mousePosition={mousePosition}
                />              
                <div style={{ flex: 1 }}>
                    <Canvas
                        config={config}
                        handleMouseDown={handleMouseDown}
                        handleMouseMove={handleMouseMove}
                        handleDoubleClick={handleDoubleClick}
                        renderGrid={renderGrid}
                        geometry={geometry}
                        alignmentGuides={alignmentGuides}
                        currentGeometryPoints={currentGeometryPoints}
                        mousePosition={mousePosition}
                        setMousePosition={setMousePosition}
                        waypoints={waypoints}
                        waypointsDragHandlers={waypointsDragHandlers}
                        exits={exits}
                        exitsDragHandlers={exitsDragHandlers}
                        distributions={distributions}
                        distributionsDragHandlers={distributionsDragHandlers}
                        currentRect={currentRect}
                        currentExit={currentExit}
                        currentWaypoint={currentWaypoint}
                        currentConnectionPath={currentConnectionPath}
                        connections={connections}
                        updateConnections={updateConnections}
                        handleEdgeDrag={handleEdgeDrag}
                    />
                </div>
            </div>
            <GeometryWarnings 
          waypoints={waypoints}
          exits={exits}
          distributions={distributions}
          geometry={geometry}
          isDragging={isDragging}
          draggedItem={draggedItem}
            />
        
        </div>
        
         
    );
};

export default App;
