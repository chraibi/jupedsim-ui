import React, { memo, useMemo } from 'react';
import { memo as memoize } from 'lodash';

// Memoized Agent Component
const AgentComponent = memo(({ x, y, color = 'blue', radius = 5 }) => {
  return (
    <div 
      style={{
        position: 'absolute',
        left: `${x}px`, 
        top: `${y}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        borderRadius: '50%',
        backgroundColor: color,
        transform: 'translate(-50%, -50%)'
      }}
    />
  );
});

// Simulation Container
const AgentSimulation = ({ agents, width = 800, height = 600 }) => {
  // Memoize agent rendering to prevent unnecessary re-renders
  const memoizedAgents = useMemo(() => {
    return agents.map(agent => (
      <AgentComponent 
        key={agent.id}
        x={agent.x} 
        y={agent.y}
        color={agent.color}
      />
    ));
  }, [agents]);

  return (
    <div 
      style={{
        position: 'relative', 
        width: `${width}px`, 
        height: `${height}px`, 
        border: '1px solid black'
      }}
    >
      {memoizedAgents}
    </div>
  );
};

// Performance Monitoring Component
const PerformanceMonitor = ({ agents }) => {
  return (
    <div style={{ 
      position: 'absolute', 
      top: 10, 
      right: 10, 
      background: 'rgba(255,255,255,0.7)', 
      padding: '10px' 
    }}>
      <div>Total Agents: {agents.length}</div>
      <div>Render Time: {performance.now()} ms</div>
    </div>
  );
};

// Example Usage
const SimulationApp = () => {
  // Generate sample agents
  const agents = useMemo(() => {
    return Array.from({ length: 500 }, (_, index) => ({
      id: index,
      x: Math.random() * 800,
      y: Math.random() * 600,
      color: Math.random() > 0.5 ? 'blue' : 'red'
    }));
  }, []);

  return (
    <div>
      <AgentSimulation agents={agents} />
      <PerformanceMonitor agents={agents} />
    </div>
  );
};

export default SimulationApp;
