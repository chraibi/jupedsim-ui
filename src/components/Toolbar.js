import React from "react";

const Toolbar = ({ config, setConfig, mousePosition }) => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 40px",
                backgroundColor: "#f0f0f0",
                borderBottom: "1px solid #ccc",
            }}
        >
            {/* Show Grid Toggle */}
            <label style={{  color: "#333", display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                    type="checkbox"
                    checked={config.showGrid}
                    onChange={(e) =>
                        setConfig((prev) => ({ ...prev, showGrid: e.target.checked }))
                    }
                />
                Show Grid
            </label>
            <div style={{ fontSize: "14px", color: "#333" }}>
                Grid spacing: {config.gridSpacing}
            </div>
            <div style={{ fontSize: "14px", color: "#333" }}>
                Scale: {config.scale}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Mouse Position */}
            {mousePosition && (
                <div style={{ fontSize: "14px", color: "#333" }}>
                     ({mousePosition.x.toFixed(2)} m, {mousePosition.y.toFixed(2)} m)
                </div>
            )}
            </label>
        </div>
    );
};

export default Toolbar;
