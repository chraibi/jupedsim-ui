import React from "react";
import logo from "../assets/logo.png"; // Adjust path as necessary

const Header = () => {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px",
                backgroundColor: "#f0f0f0",
                borderBottom: "1px solid #ccc",
            }}
        >
            <img
                src={logo}
                alt="App Logo"
                style={{
                    height: "50px", // Adjust logo size
                    marginBottom: "5px", // Optional margin below the logo
                }}
            />
            <h1 style={{ fontSize: "18px", margin: 0, color: "#333" }}>Simulation Application</h1>
        </div>
    );
};

export default Header;
