import React, { useRef, useEffect, useState } from 'react';

class AgentRenderer {
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = width;
    this.height = height;
    this.agents = [];
    this.animationFrameId = null;
  }

  // Efficient batch rendering
  render() {
    // Clear previous frame
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Batch rendering with minimal context switches
    this.ctx.beginPath();
    this.agents.forEach(agent => {
      this.ctx.moveTo(agent.x + agent.radius, agent.y);
      this.ctx.arc(agent.x, agent.y, agent.radius, 0, Math.PI * 2);
    });

    // Efficient color and fill
    this.ctx.fillStyle = 'blue';
    this.ctx.fill();
  }

  // Update agent positions (example with simple movement)
  update() {
    this.agents.forEach(agent => {
      // Simple random walk
      agent.x += (Math.random() - 0.5) * 2;
      agent.y += (Math.random() - 0.5) * 2;

      // Wrap around canvas
      agent.x = (agent.x + this.width) % this.width;
      agent.y = (agent.y + this.height) % this.height;
    });
  }

  // Start continuous animation
  start() {
    const animate = () => {
      this.update();
      this.render();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  // Stop animation
  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // Add agents to simulation
  addAgents(count, options = {}) {
    const { 
      radius = 5, 
      color = 'blue' 
    } = options;

    const newAgents = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      radius,
      color
    }));

    this.agents.push(...newAgents);
  }
}

// React Component Wrapper
const CanvasSimulation = ({ 
  width = 800, 
  height = 600, 
  agentCount = 1000 
}) => {
  const canvasRef = useRef(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    agentCount: 0,
    renderTime: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new AgentRenderer(canvas, width, height);

    // Add agents
    renderer.addAgents(agentCount);

    // Start simulation
    const startTime = performance.now();
    renderer.start();

    // Performance tracking
    const performanceInterval = setInterval(() => {
      setPerformanceMetrics({
        agentCount: renderer.agents.length,
        renderTime: performance.now() - startTime
      });
    }, 1000);

    // Cleanup
    return () => {
      renderer.stop();
      clearInterval(performanceInterval);
    };
  }, [width, height, agentCount]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        style={{ border: '1px solid black' }}
      />
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        background: 'rgba(255,255,255,0.7)', 
        padding: '10px' 
      }}>
        <div>Agents: {performanceMetrics.agentCount}</div>
        <div>Render Time: {performanceMetrics.renderTime.toFixed(2)} ms</div>
      </div>
    </div>
  );
};

export default CanvasSimulation;
```

Key Performance Considerations:

1. React Approach (Recommended for ~100-500 agents):
- Uses `React.memo()` to prevent unnecessary re-renders
- Memoizes agent components
- Minimal DOM manipulation
- Good for smaller simulations with complex agent interactions

2. Canvas Approach (Recommended for 500-10,000 agents):
- Direct GPU rendering
- Batch rendering techniques
- Minimal JavaScript overhead
- Good for large-scale simulations
- Low memory and CPU usage

Performance Tips:
- Use `requestAnimationFrame()` for smooth animations
- Implement spatial partitioning for collision detection
- Consider WebWorkers for complex agent logic
- Profile and benchmark your specific use case

Recommendation:
- Start with React rendering
- Profile performance
- Switch to Canvas if you experience slowdowns
- Consider WebGL for extreme scale (>10,000 agents)

Would you like me to elaborate on any specific aspect of these rendering approaches?