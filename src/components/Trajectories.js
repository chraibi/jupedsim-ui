

import { Shape } from "react-konva";


import React, { useEffect, useState } from "react";
import { Layer, Circle } from "react-konva";

const CanvasTrajectoryVisualizer = ({ trajectoryFile }) => {
  const [trajectories, setTrajectories] = useState([]);
  const [positions, setPositions] = useState([]); // Current positions of the circles
  const [frame, setFrame] = useState(0); // Current animation frame

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

        setTrajectories(parsedTrajectories);
      })
      .catch((error) => console.error("Error loading trajectory file:", error));
  }, [trajectoryFile]);

  useEffect(() => {
    if (trajectories.length === 0) return;

    // Determine bounds for scaling
    const xs = trajectories.map((t) => t.x);
    const ys = trajectories.map((t) => t.y);
    const sceneMinX = Math.min(...xs);
    const sceneMaxX = Math.max(...xs);
    const sceneMinY = Math.min(...ys);
    const sceneMaxY = Math.max(...ys);

    const stageWidth = 800; // Adjust based on your stage size
    const stageHeight = 600;
    const scaleX = (x) =>
      ((x - sceneMinX) / (sceneMaxX - sceneMinX)) * stageWidth;
    const scaleY = (y) =>
      stageHeight - ((y - sceneMinY) / (sceneMaxY - sceneMinY)) * stageHeight;

    // Initialize positions for each unique trajectory ID
    const initialPositions = Array.from(
      new Set(trajectories.map((t) => t.id))
    ).map((id) => {
      const firstPoint = trajectories.find((t) => t.id === id && t.fr === 0);
      return {
        id,
        x: scaleX(firstPoint?.x || 0),
        y: scaleY(firstPoint?.y || 0),
      };
    });

    setPositions(initialPositions);

    // Start the animation
    const animate = () => {
      setFrame((prevFrame) => prevFrame + 5); // Increment frame
      requestAnimationFrame(animate);
    };
    animate();
  }, [trajectories]);

  // Update positions based on the current frame
  useEffect(() => {
    if (trajectories.length === 0 || positions.length === 0) return;

    const xs = trajectories.map((t) => t.x);
    const ys = trajectories.map((t) => t.y);
    const sceneMinX = Math.min(...xs);
    const sceneMaxX = Math.max(...xs);
    const sceneMinY = Math.min(...ys);
    const sceneMaxY = Math.max(...ys);

    const stageWidth = 800; // Adjust based on your stage size
    const stageHeight = 600;
    const scaleX = (x) =>
      ((x - sceneMinX) / (sceneMaxX - sceneMinX)) * stageWidth;
    const scaleY = (y) =>
      stageHeight - ((y - sceneMinY) / (sceneMaxY - sceneMinY)) * stageHeight;

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
      return pos; // Keep the previous position if no point exists for this frame
    });

    setPositions(updatedPositions);
  }, [frame, trajectories, positions]);

    console.log("Rendered Circles:", positions.map((pos) => (
  <Circle
    key={pos.id}
    x={pos.x}
    y={pos.y}
    radius={5}
    fill="red"
    stroke="blue"
    strokeWidth={1}
  />
)));
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


