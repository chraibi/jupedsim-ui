import React from "react";

const Toolbar = ({ config, setConfig, mousePosition }) => {
    const handleGridSpacingChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (value > 0) {
            setConfig((prevConfig) => ({
                ...prevConfig,
                gridSpacing: value,
            }));
        }
    };

    const handleScaleChange = (e) => {
        const value = parseFloat(e.target.value);
        if (value > 0) {
            setConfig((prevConfig) => ({
                ...prevConfig,
                scale: value,
            }));
        }
    };
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
                <label>
                    Grid spacing:
                    <input
                        type="number"
                        value={config.gridSpacing}
                        onChange={handleGridSpacingChange}
                        style={{
                            width: "60px",
                            marginLeft: "5px",
                            padding: "2px",
                            fontSize: "14px",
                        }}
                    />
                </label>
            </div>
            <div style={{ fontSize: "14px", color: "#333" }}>
                <label>
                    Scale:
                    <input
                        type="number"
                        step="0.1"
                        value={config.scale}
                        onChange={handleScaleChange}
                        style={{
                            width: "60px",
                            marginLeft: "5px",
                            padding: "2px",
                            fontSize: "14px",
                        }}
                    />
                </label>
            </div>
                <span style={{ marginLeft: "10px", color: "#666" }}>
                    (── = {(config.gridSpacing / config.scale).toFixed(2)} m)
                </span>





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
