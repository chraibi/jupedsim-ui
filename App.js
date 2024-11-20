import React from "react";
import ConfigProvider from "./context/ConfigContext";
import ToolProvider from "./context/ToolContext";
import Header from "./components/Header";
import ConfigPanel from "./components/ConfigPanel";
import Canvas from "./components/Canvas";
import "./App.css";

const App = () => {
    return (
        <ConfigProvider>
            <ToolProvider>
                <div style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
                    <ConfigPanel />
                    <Canvas />
                </div>
            </ToolProvider>
        </ConfigProvider>
    );
};

export default App;
