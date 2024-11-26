// import React, { useContext } from "react";
// import { ConfigContext } from "../context/ConfigContext";
// import { ToolContext } from "../context/ToolContext";
import React from 'react';

const ConfigPanel = ({
    tool,
    setTool,
    config,
    setConfig,
    exportData,
    logo,
}) => {
    const buttonStyle = (toolName) => ({
        padding: '10px 15px',
        margin: '5px',
        border: '1px solid #ccc',
        backgroundColor: tool === toolName ? '#4CAF50' : '#f0f0f0',
        color: tool === toolName ? 'white' : 'black',
        cursor: 'pointer',
        borderRadius: '4px',
        outline: 'none',
    });

    return (
        <div
            style={{
                padding: '10px',
                backgroundColor: '#f0f0f0',
                borderRight: '1px solid #ccc',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
            }}
        >
            {/* Logo Section */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px',
                    height: '10px',
                    backgroundColor: '#f0f0f0',
                }}
            >
                <img
                    src={logo}
                    className="App-logo"
                    alt="logo"
                    style={{
                        height: '70px',
                        marginBottom: '5px',
                    }}
                />
            </div>

            <h3>Simulation Config</h3>

            {/* Tools Section */}
            <div style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                <h4>Tools</h4>
                <button style={buttonStyle('geometry')} onClick={() => setTool('geometry')}>
                    Geometry Tool
                </button>
                <button style={buttonStyle('waypoint')} onClick={() => setTool('waypoint')}>
                    Waypoint Tool
                </button>
                <button style={buttonStyle('exit')} onClick={() => setTool('exit')}>
                    Exit Tool
                </button>
                <button style={buttonStyle('distribution')} onClick={() => setTool('distribution')}>
                    Distribution Tool
                </button>
                <button style={buttonStyle('connection')} onClick={() => setTool('connection')}>
                    Connection Tool
                </button>
                <button style={buttonStyle('delete')} onClick={() => setTool('delete')}>
                    Delete Tool
                </button>
                <button style={buttonStyle('export')} onClick={exportData}>
                    Export Data
                </button>
            </div>
        </div>
    );
};

export default ConfigPanel;
