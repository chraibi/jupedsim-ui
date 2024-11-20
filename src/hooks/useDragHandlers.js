import { useState } from "react";

const useDragHandlers = (config, findNearestSnapPoint) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = (updatedElement, i, setElements, elements, e) => {
        const pos = e.target.position();
        let scaledPos = { x: pos.x / config.scale, y: pos.y / config.scale };
        scaledPos = findNearestSnapPoint(scaledPos);
        const updatedObject = { ...updatedElement, x: scaledPos.x, y: scaledPos.y };

        setElements(
            elements.map((element, index) =>
                index === i ? updatedObject : element
            )
        );
    };

    const createDragHandlers = (setElements, elements) => ({
        onDragStart: () => setIsDragging(true),
        onDragMove: (e, i) => {
            setIsDragging(true);
            handleDrag(elements[i], i, setElements, elements, e);
        },
        onDragEnd: (e, i) => {
            setIsDragging(false);
            handleDrag(elements[i], i, setElements, elements, e);
        },
    });

    return createDragHandlers;
};

export default useDragHandlers;
