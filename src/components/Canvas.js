import React, { useContext, useState } from "react";
import { Stage, Layer, Line, Rect } from "react-konva";
import ConfigContext from "../context/ConfigContext";
import ToolContext from "../context/ToolContext";
import useGrid from "../hooks/useGrid";
import useDragHandlers from "../hooks/useDragHandlers";

const Canvas = () => {
    const { config } = useContext(ConfigContext);
    const { tool } = useContext(ToolContext);
    const [distributions, setDistributions] = useState([]);

    const gridLines = useGrid(config.gridSpacing, config.scale);
    const { handleDragStart, handleDragMove, handleDragEnd } = useDragHandlers(setDistributions);

    return (
        <Stage width={window.innerWidth * 0.75} height={window.innerHeight}>
            <Layer>{config.showGrid && gridLines}</Layer>
            <Layer>
                {distributions.map((d, i) => (
                    <Rect
                        key={i}
                        x={d.x}
                        y={d.y}
                        width={d.width}
                        height={d.height}
                        fill="orange"
                        draggable
                        onDragStart={(e) => handleDragStart(e, i)}
                        onDragMove={(e) => handleDragMove(e, i)}
                        onDragEnd={(e) => handleDragEnd(e, i)}
                    />
                ))}
            </Layer>
        </Stage>
    );
};

export default Canvas;
