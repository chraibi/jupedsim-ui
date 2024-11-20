import { useState, useCallback } from 'react';

const useGrid = (initialGridSpacing = 50, initialSnapThreshold = 10) => {
    const [gridSpacing, setGridSpacing] = useState(initialGridSpacing);
    const [snapThreshold, setSnapThreshold] = useState(initialSnapThreshold);
    const [showGrid, setShowGrid] = useState(true);

    // Function to generate grid lines
    const renderGrid = useCallback(() => {
        const lines = [];
        const width = window.innerWidth * 0.75; // Adjust canvas size
        const height = window.innerHeight;

        // Vertical lines
        for (let x = 0; x <= width; x += gridSpacing) {
            lines.push({
                key: `v-${x}`,
                points: [x, 0, x, height],
            });
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += gridSpacing) {
            lines.push({
                key: `h-${y}`,
                points: [0, y, width, y],
            });
        }

        return lines;
    }, [gridSpacing]);

    // Function to find the nearest snap point
    const findNearestSnapPoint = useCallback(
        (pos) => {
            const snappedX = Math.round(pos.x / gridSpacing) * gridSpacing;
            const snappedY = Math.round(pos.y / gridSpacing) * gridSpacing;

            if (
                Math.abs(pos.x - snappedX) <= snapThreshold &&
                Math.abs(pos.y - snappedY) <= snapThreshold
            ) {
                return { x: snappedX, y: snappedY };
            }

            return pos;
        },
        [gridSpacing, snapThreshold]
    );

    // Functions to toggle grid visibility and update settings
    const toggleGrid = () => setShowGrid((prev) => !prev);
    const updateGridSpacing = (spacing) => setGridSpacing(spacing);
    const updateSnapThreshold = (threshold) => setSnapThreshold(threshold);

    return {
        gridSpacing,
        snapThreshold,
        showGrid,
        toggleGrid,
        updateGridSpacing,
        updateSnapThreshold,
        renderGrid,
        findNearestSnapPoint,
    };
};

export default useGrid;
