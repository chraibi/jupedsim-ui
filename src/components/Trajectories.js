import React, { useEffect, useState, useRef } from "react";
import { Circle } from "react-konva";

const CanvasTrajectoryVisualizer = ({ trajectoryFile }) => {
    const [trajectories, setTrajectories] = useState([]);
    const [positions, setPositions] = useState([]);
    const [frame, setFrame] = useState(0);
    const maxFrameRef = useRef(0); // Maximum frame in the trajectory data
    const animationRef = useRef(null); // Animation frame reference

    useEffect(() => {
        // Fetch and parse trajectory data
        fetch(trajectoryFile)
            .then((response) => response.text())
            .then((text) => {
                const parsedTrajectories = text
                      .split("\n")
                      .filter((line) => line.trim() !== "")
                      .map((line) => {
                          const parts = line.trim().split(/\s+/).map(Number);
                          if (parts.length === 5) {
                              const [id, fr, x, y] = parts;
                              return { id, fr, x, y };
                          }
                          return null;
                      })
                      .filter(Boolean);

                const maxFrame = Math.max(...parsedTrajectories.map((t) => t.fr));
                maxFrameRef.current = maxFrame;

                // Set trajectories
                setTrajectories(parsedTrajectories);

                // Initialize positions
                const initialPositions = Array.from(
                    new Set(parsedTrajectories.map((t) => t.id))
                ).map((id) => {
                    const firstPoint = parsedTrajectories.find(
                        (t) => t.id === id && t.fr === 0
                    );
                    return {
                        id,
                        x: firstPoint?.x || 0,
                        y: firstPoint?.y || 0,
                        lastFrame: Math.max(
                            ...parsedTrajectories.filter((t) => t.id === id).map((t) => t.fr)
                        ), // Store the last frame for this agent
                    };
                });

                setPositions(initialPositions);
            })
            .catch((error) => console.error("Error loading trajectory file:", error));
    }, [trajectoryFile]);

    const layerRef = useRef(null); 
    
    useEffect(() => {
        if (trajectories.length === 0) return;
        
        const xs = trajectories.map((t) => t.x);
        const ys = trajectories.map((t) => t.y);
        const sceneMinX = Math.min(...xs);
        const sceneMaxX = Math.max(...xs);
        const sceneMinY = Math.min(...ys);
        const sceneMaxY = Math.max(...ys);

        const stageWidth = 800;
        const stageHeight = 600;
        const scaleX = (x) =>
              ((x - sceneMinX) / (sceneMaxX - sceneMinX)) * stageWidth;
        const scaleY = (y) =>
              stageHeight - ((y - sceneMinY) / (sceneMaxY - sceneMinY)) * stageHeight;

        // Animation logic
        const animate = () => {
            setFrame((prevFrame) => {
                const nextFrame = prevFrame + 1;
                if (prevFrame >= maxFrameRef.current) {
                    cancelAnimationFrame(animationRef.current);
                    return prevFrame; // Stop animation
                }
                
                return prevFrame + 1;
            });
            
            // Update positions
            const updatedPositions = positions.map((pos) => {
                const nextPoint = trajectories.find(
                    (t) => t.id === pos.id && t.fr === frame
                );
                
                if (nextPoint) {
                    return {
                        ...pos,
                        x: scaleX(nextPoint.x),
                        y: scaleY(nextPoint.y),
                    };
                }
                return pos;
            })
                  .filter((pos) => pos.lastFrame >= frame);
            setPositions(updatedPositions);
            if (layerRef.current) {
                layerRef.current.batchDraw();
            }
            // Schedule next frame
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate); // Start animation

        return () => cancelAnimationFrame(animationRef.current); // Cleanup on unmount
    }, [trajectories, positions, frame]);

    return (
        <>
            {positions.map((pos) => (
                <Circle
                    key={pos.id}
                    x={pos.x}
                    y={pos.y}
                    radius={5}
                    fill="red"
                    stroke="blue"
                    strokeWidth={1}
                />
            ))}
        </>
    );
};

export default CanvasTrajectoryVisualizer;
