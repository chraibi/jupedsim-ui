import React, { createContext, useState } from "react";

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        gridSpacing: 50,
        showGrid: true,
        scale: 10,
        showAlignmentGuides: true,
        snapThreshold: 10,
    });

    return (
        <ConfigContext.Provider value={{ config, setConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};
// Export both the context and provider
export { ConfigContext };
export default ConfigProvider;
