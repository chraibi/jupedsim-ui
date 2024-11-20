import React, { useContext } from "react";
import ConfigContext from "../context/ConfigContext";
import ToolContext from "../context/ToolContext";

const ConfigPanel = () => {
    const { config, setConfig } = useContext(ConfigContext);
    const { tool, setTool } = useContext(ToolContext);

    const buttonStyle = (toolName) => ({
        padding: "10px 15px",
        margin: "5px",
        border: "1px solid #ccc",
        backgroundColor: tool === toolName ? "#4CAF50" : "#f0f0f0",
        color: tool === toolName ? "white" : "black",
        cursor: "pointer",
        borderRadius: "4px",
        outline: "none",
    });

    return (
        <div style={{ padding: "10px", backgroundColor: "#f0f0f0", height: "100%" }}>
            <h3>Simulation Config</h3>
            <div>
                <button style={buttonStyle("geometry")} onClick={() => setTool("geometry")}>
                    Geometry Tool
                </button>
                <button style={buttonStyle("distribution")} onClick={() => setTool("distribution")}>
                    Distribution Tool
                </button>
            </div>
            <div>
                <label>
                    Show Grid:
                    <input
                        type="checkbox"
                        checked={config.showGrid}
                        onChange={(e) => setConfig((prev) => ({ ...prev, showGrid: e.target.checked }))}
                    />
                </label>
            </div>
        </div>
    );
};

export default ConfigPanel;
