import React from 'react';
import { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';

function App() {
    // State to store our agents - when this changes, React re-renders
    const [agents, setAgents] = useState([]);
    
    // Connect to the WebSocket
    const { lastJsonMessage, readyState } = useWebSocket('ws://localhost:8000/ws', {
        onOpen: () => console.log('Connected'),
        shouldReconnect: (closeEvent) => true,
    });
    
    // When we get a new message, update our agents
    useEffect(() => {
        if (lastJsonMessage) {
            setAgents(lastJsonMessage);
        }
    }, [lastJsonMessage]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Visualization Area */}
            <div className="relative w-full h-[800px]">
                {/* Map through agents and display each one */}
                {agents.map((agent) => (
                    <div
                        key={agent.id}
                        className="absolute w-6 h-6 bg-blue-500 rounded-full"
                        style={{
                            left: `${(agent.position[0] * 100)}%`,
                            top: `${(agent.position[1] * 100)}%`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
export default App;
