
export    const findAlignmentGuides = (draggedElement, elements, config) => {
        const guides = { x: null, y: null };

        elements.forEach((element) => {
            if (element.id !== draggedElement.id) {
                if (Math.abs(element.x - draggedElement.x) < config.snapThreshold) {
                    guides.x = element.x;
                }
                if (Math.abs(element.y - draggedElement.y) < config.snapThreshold) {
                    guides.y = element.y;
                }
            }
        });

        return guides;
    };
