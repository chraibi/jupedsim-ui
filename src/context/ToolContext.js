import React, { createContext, useState } from "react";

const ToolContext = createContext();

export const ToolProvider = ({ children }) => {
    const [tool, setTool] = useState("geometry");

    return (
        <ToolContext.Provider value={{ tool, setTool }}>
            {children}
        </ToolContext.Provider>
    );
};


export { ToolContext };
export default ToolProvider;
