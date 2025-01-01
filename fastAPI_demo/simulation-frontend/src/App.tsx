import React from 'react';
import { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';

function App() {
  const [agents, setAgents] = useState([]);
  
  const { lastJsonMessage, readyState } = useWebSocket('ws://localhost:8000/ws', {
    onOpen: () => console.log('WebSocket Connected'),
    onError: (error) => console.log('WebSocket Error:', error),
    shouldReconnect: (closeEvent) => true,
  });
  
  useEffect(() => {
    if (lastJsonMessage) {
      setAgents(lastJsonMessage);
    }
  }, [lastJsonMessage]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Simulation Viewer</h1>
      
      {/* Connection Status */}
      <div className="mb-4">
        Status: {readyState === 1 ? 'Connected' : 'Connecting...'}
      </div>

      {/* Simulation View */}
      <div 
        className="relative w-full h-[600px] border border-gray-300 rounded bg-gray-50"
        style={{ overflow: 'hidden' }}
      >
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="absolute w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(agent.position[0] * 100)}%`,
              top: `${(agent.position[1] * 100)}%`,
              transition: 'all 0.1s linear'
            }}
          />
        ))}
      </div>

      {/* Agent Positions List */}
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Agent Positions</h2>
        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent.id}>
              Agent {agent.id}: ({agent.position[0].toFixed(2)}, {agent.position[1].toFixed(2)})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
