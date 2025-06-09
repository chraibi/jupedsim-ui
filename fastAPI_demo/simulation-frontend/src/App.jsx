import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import useWebSocket from 'react-use-websocket';

function App() {
    const [agents, setAgents] = useState([]);
    const [iterationCount, setIterationCount] = useState(0);
    const [isRunning, setIsRunning] = useState(false);  // Start with false
    const [count, setCount] = useState(10);
    const [hasStarted, setHasStarted] = useState(false);  // Track if simulation has been started
    const [geometry, setGeometry] = useState(null);  // Store geometry data
    
    const { lastJsonMessage, sendJsonMessage, readyState } = useWebSocket('ws://localhost:8000/ws', {
        onOpen: () => console.log('WebSocket Connected'),
        onError: (error) => console.log('WebSocket Error:', error),
        shouldReconnect: (closeEvent) => true,
    });
    
    useEffect(() => {
        if (lastJsonMessage) {
            console.log("Received message from backend:", lastJsonMessage);
            
            // Handle geometry data
            if (lastJsonMessage.type === 'geometry') {
                setGeometry(lastJsonMessage.geometry);
                return;
            }
            
            // Handle simulation data
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
            count: count,
            ...newParams
        };
        console.log("Sending parameters:", params);
        sendJsonMessage(params);
    }, [isRunning, count, sendJsonMessage]);

    const handleCountChange = useCallback((newCount) => {
        setCount(newCount);
        // Only send update if simulation has been started
        if (hasStarted) {
            sendJsonMessage({
                is_running: isRunning,
                count: newCount
            });
        }
    }, [isRunning, hasStarted, sendJsonMessage]);

    const toggleSimulation = useCallback(() => {
        const newIsRunning = !isRunning;
        setIsRunning(newIsRunning);
        setHasStarted(true);
        
        sendJsonMessage({
            is_running: newIsRunning,
            count: count
        });
    }, [isRunning, count, sendJsonMessage]);

    const handleReset = useCallback(() => {
        setAgents([]);
        setIterationCount(0);
        setIsRunning(false);
        setHasStarted(false);
        setGeometry(null);  // Clear geometry
        
        sendJsonMessage({ 
            reset: true,
            is_running: false,
            count: count
        });
    }, [count, sendJsonMessage]);

    // Helper function to convert simulation coordinates to screen coordinates
    const toScreenCoords = (x, y) => ({
        x: (x / 10) * 100,  // Convert to percentage of container
        y: (y / 10) * 100
    });

    // Helper function to create SVG path from polygon points
    const createPolygonPath = (points) => {
        return points.map((point, index) => {
            const coords = toScreenCoords(point[0], point[1]);
            return `${index === 0 ? 'M' : 'L'} ${coords.x} ${coords.y}`;
        }).join(' ') + ' Z';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-[1600px] mx-auto">
                {/* Header with Controls */}
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Simulation Viewer</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Count Control */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Count:</label>
                            <input 
                                type="range"
                                min="10"
                                max="1000"
                                step="1"
                                value={count}
                                onChange={(e) => handleCountChange(parseFloat(e.target.value))}
                                className="w-32"
                            />
                            <span className="text-sm text-gray-600">{count.toFixed(0)}</span>
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
                    {/* SVG for geometry visualization */}
                    <svg 
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                    >
                        {/* Grid pattern */}
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#grid)" />
                        
                        {/* Render geometry if available */}
                        {geometry && (
                            <>
                                {/* Main boundary */}
                                <path 
                                    d={createPolygonPath(geometry.boundary)}
                                    fill="rgba(229, 231, 235, 0.3)"
                                    stroke="#9CA3AF"
                                    strokeWidth="0.5"
                                />
                                
                                {/* Obstacle */}
                                <path 
                                    d={createPolygonPath(geometry.obstacle)}
                                    fill="rgba(239, 68, 68, 0.7)"
                                    stroke="#DC2626"
                                    strokeWidth="0.8"
                                />
                                
                                {/* Exit */}
                                <path 
                                    d={createPolygonPath(geometry.exit)}
                                    fill="rgba(34, 197, 94, 0.7)"
                                    stroke="#16A34A"
                                    strokeWidth="0.8"
                                />
                            </>
                        )}
                    </svg>
                    
                    {/* Agents */}
                    {agents.map((agent) => {
                        const screenCoords = toScreenCoords(agent.position[0], agent.position[1]);
                        return (
                            <div
                                key={agent.id}
                                className="absolute w-4 h-4 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 hover:scale-150 transition-transform border-2 border-white shadow-lg"
                                style={{
                                    left: `${screenCoords.x}%`,
                                    top: `${screenCoords.y}%`,
                                    transition: 'all 0.1s linear',
                                    zIndex: 10
                                }}
                            >
                                <div className="absolute -top-6 w-full text-center text-xs font-medium text-gray-700">
                                    {agent.id}
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Legend */}
                    <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md border text-sm">
                        <div className="font-semibold mb-2">Legend</div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 bg-red-400 border border-red-600"></div>
                            <span>Obstacle</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 bg-green-400 border border-green-600"></div>
                            <span>Exit</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div>
                            <span>Agents</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
