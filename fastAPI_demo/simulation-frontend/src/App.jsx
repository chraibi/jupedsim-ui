import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import useWebSocket from 'react-use-websocket';

function App() {
    const [agents, setAgents] = useState([]);
    const [iterationCount, setIterationCount] = useState(0);
    const [isRunning, setIsRunning] = useState(false);  // Start with false
    const [speed, setSpeed] = useState(10);
    const [hasStarted, setHasStarted] = useState(false);  // Track if simulation has been started
    
    const { lastJsonMessage, sendJsonMessage, readyState } = useWebSocket('ws://localhost:8000/ws', {
        onOpen: () => console.log('WebSocket Connected'),
        onError: (error) => console.log('WebSocket Error:', error),
        shouldReconnect: (closeEvent) => true,
    });
    
    useEffect(() => {
        if (lastJsonMessage) {
            console.log("Received message from backend:", lastJsonMessage);
            const { positions, iteration_count, remaining_agents } = lastJsonMessage;
            
            // Convert positions object to array format expected by frontend
            if (positions) {
                const agentArray = Object.entries(positions).map(([id, pos]) => ({
                    id: parseInt(id),
                    position: [pos.x, pos.y]
                }));
                setAgents(agentArray);
            }
            
            if (typeof iteration_count !== 'undefined') {
                setIterationCount(iteration_count);
            }
        }
    }, [lastJsonMessage]);

    // Use useCallback to prevent unnecessary re-renders
    const updateSimulation = useCallback((newParams = {}) => {
        const params = {
            is_running: isRunning,
            speed: speed,
            ...newParams
        };
        console.log("Sending parameters:", params);
        sendJsonMessage(params);
    }, [isRunning, speed, sendJsonMessage]);

    const handleSpeedChange = useCallback((newSpeed) => {
        setSpeed(newSpeed);
        // Only send update if simulation has been started
        if (hasStarted) {
            sendJsonMessage({
                is_running: isRunning,
                speed: newSpeed
            });
        }
    }, [isRunning, hasStarted, sendJsonMessage]);

    const toggleSimulation = useCallback(() => {
        const newIsRunning = !isRunning;
        setIsRunning(newIsRunning);
        setHasStarted(true);
        
        sendJsonMessage({
            is_running: newIsRunning,
            speed: speed
        });
    }, [isRunning, speed, sendJsonMessage]);

    const handleReset = useCallback(() => {
        setAgents([]);
        setIterationCount(0);
        setIsRunning(false);
        setHasStarted(false);
        
        sendJsonMessage({ 
            reset: true,
            is_running: false,
            speed: speed
        });
    }, [speed, sendJsonMessage]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-[1600px] mx-auto">
                {/* Header with Controls */}
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Simulation Viewer</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Speed Control */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Speed:</label>
                            <input 
                                type="range"
                                min="10"
                                max="500"
                                step="1"
                                value={speed}
                                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                                className="w-32"
                            />
                            <span className="text-sm text-gray-600">{speed.toFixed(0)}</span>
                        </div>

                        {/* Play/Pause Button */}
                        <button
                            onClick={toggleSimulation}
                            className={`px-4 py-2 rounded-md font-medium ${
                                isRunning 
                                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                        >
                            {isRunning ? 'Stop' : 'Start'}
                        </button>

                        {/* Reset Button */}
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 rounded-md font-medium bg-gray-500 hover:bg-gray-600 text-white"
                        >
                            Reset
                        </button>

                        {/* Connection Status */}
                        <div className="text-sm px-4 py-2 rounded bg-gray-50">
                            Status: {readyState === 1 ? 
                                     <span className="text-green-600 font-medium">Connected</span> : 
                                     <span className="text-amber-600 font-medium">Connecting...</span>
                                    }
                        </div>
                        
                        {/* Simulation count */}
                        <div className="text-sm px-4 py-2 rounded bg-gray-50">
                            Simulation count: 
                            <span className="text-green-600 font-medium"> {iterationCount}</span>                    
                        </div>

                        {/* Agent count */}
                        <div className="text-sm px-4 py-2 rounded bg-gray-50">
                            Agents: 
                            <span className="text-blue-600 font-medium"> {agents.length}</span>                    
                        </div>
                    </div>
                </div>

                {/* Visualization Area */}
                <div 
                    className="relative w-full h-[800px] rounded-lg border border-gray-200 bg-white shadow-lg"
                    style={{ overflow: 'hidden' }}
                >
                    {/* Grid Lines */}
                    <div className="absolute inset-0" style={{ 
                             backgroundImage: 'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)',
                             backgroundSize: '50px 50px'
                         }} />
                    
                    {/* Simulation boundary visualization */}
                    <div 
                        className="absolute border-2 border-red-300 bg-red-50 bg-opacity-20"
                        style={{
                            left: '0%',
                            top: '0%', 
                            width: '50%',  // 10 units out of 20 total width
                            height: '50%', // 10 units out of 20 total height
                        }}
                    />
                    
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            className="absolute w-6 h-6 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 hover:scale-150 transition-transform"
                            style={{
                                left: `${(agent.position[0] / 20) * 100}%`,  // Scale to 20x20 grid
                                top: `${(agent.position[1] / 20) * 100}%`,   // Scale to 20x20 grid
                                transition: 'all 0.1s linear'
                            }}
                        >
                            <div className="absolute -top-6 w-full text-center text-xs">
                                {agent.id}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default App;