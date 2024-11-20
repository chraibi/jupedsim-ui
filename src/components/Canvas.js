
// import { ConfigContext } from "../context/ConfigContext";
// import { ToolContext } from "../context/ToolContext";
// import useGrid from "../hooks/useGrid";
// import useDragHandlers from "../hooks/useDragHandlers";
import React from "react";
import { Stage, Layer, Line} from "react-konva";
import GeometryShape from './GeometryShape'
import Waypoint from './WayPoint'
import Exit from './Exit'
import Distribution from './Distribution'
import ConnectionLine from './ConnectionLine'
const Canvas = ({
    config,
    handleMouseDown,
    handleMouseMove,
    handleDoubleClick,
    renderGrid,
    geometry,
    alignmentGuides,
    currentGeometryPoints,
    mousePosition,
    waypoints,
    waypointsDragHandlers,
    exits,
    exitsDragHandlers,
    distributions,
    distributionsDragHandlers,
    currentRect,
    currentExit,
    currentWaypoint,
    currentConnectionPath,
    connections,
    updateConnections,
}) => {
    return (
        <Stage
            width={window.innerWidth * 0.75}
            height={window.innerHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onDblClick={handleDoubleClick}
            style={{ background: "#ddd" }}
        >
            <Layer>
                {config.showGrid && renderGrid()}

                {/* Geometry */}
                {geometry.map((polygon, i) => (
                    <GeometryShape key={i} polygon={polygon} config={config} />
                ))}

                {/* Alignment Guides */}
                {config.showAlignmentGuides && alignmentGuides.x && (
                    <Line
                        points={[
                            alignmentGuides.x * config.scale,
                            0,
                            alignmentGuides.x * config.scale,
                            window.innerHeight,
                        ]}
                        stroke="red"
                        strokeWidth={1}
                        dash={[10, 5]}
                    />
                )}
                {config.showAlignmentGuides && alignmentGuides.y && (
                    <Line
                        points={[
                            0,
                            alignmentGuides.y * config.scale,
                            window.innerWidth,
                            alignmentGuides.y * config.scale,
                        ]}
                        stroke="red"
                        strokeWidth={1}
                        dash={[10, 5]}
                    />
                )}

                {/* Current Geometry */}
                {currentGeometryPoints && (
                    <>
                        <Line
                            points={currentGeometryPoints.flatMap((p, i) =>
                                i % 2 === 0
                                    ? [p * config.scale, currentGeometryPoints[i + 1] * config.scale]
                                    : []
                            )}
                            stroke="blue"
                            strokeWidth={2}
                            closed={false}
                        />
                        {mousePosition && (
                            <Line
                                points={[
                                    currentGeometryPoints[
                                        currentGeometryPoints.length - 2
                                    ] * config.scale,
                                    currentGeometryPoints[
                                        currentGeometryPoints.length - 1
                                    ] * config.scale,
                                    mousePosition.x * config.scale,
                                    mousePosition.y * config.scale,
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
                    <Waypoint key={i} waypoint={w} dragHandlers={waypointsDragHandlers} updateConnections={updateConnections} config={config} />
                ))}
                {/* Current Waypoint */}
                {currentWaypoint && (
                    <Waypoint waypoint={currentWaypoint} dragHandlers={waypointsDragHandlers} config={config} />
                )}

                {/* Exits */}
                {exits.map((e, i) => (
                    <Exit key={i} exit={e} dragHandlers={exitsDragHandlers}  updateConnections={updateConnections} config={config} />                   
                ))}

                {/* Current Exit */}
                {currentExit && (
                     <Exit  exit={currentExit} dragHandlers={exitsDragHandlers} config={config} />                   
                )}

                {/* Distributions */}
                {distributions.map((d, i) => (
                    <Distribution key={i} distribution={d} dragHandlers={distributionsDragHandlers}  updateConnections={updateConnections} config={config} />
                ))}

                {/* Current Distribution */}
                {currentRect && (
                    <Distribution distribution={currentRect} dragHandlers={distributionsDragHandlers} config={config} />                    
                )}

                {/* Connections */}
                {connections.map((c, i) => (
                    <ConnectionLine key={i} connection={c} config={config} />
                ))}
                {currentConnectionPath?.tempX && (
                    <Line
                        points={[
                            currentConnectionPath.x * config.scale,
                            currentConnectionPath.y * config.scale,
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
    );
};

export default Canvas;
