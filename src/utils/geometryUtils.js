export const isPointInPolygon = (x, y, points) => {
    let isInside = false;
    const n = points.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = points[i * 2];
        const yi = points[i * 2 + 1];
        const xj = points[j * 2];
        const yj = points[j * 2 + 1];
        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) isInside = !isInside;
    }
    return isInside;
};

export const isPointInCircle = (x, y, cx, cy, radius) => {
    const distanceSquared = (x - cx) ** 2 + (y - cy) ** 2;
    return distanceSquared <= radius ** 2;
};

export const findNearestSnapPoint = (pos, config) => {
    const snappedX = Math.round(pos.x / config.gridSpacing) * config.gridSpacing;
    const snappedY = Math.round(pos.y / config.gridSpacing) * config.gridSpacing;

    if (
        Math.abs(pos.x - snappedX) <= config.snapThreshold &&
            Math.abs(pos.y - snappedY) <= config.snapThreshold
    ) {
        return { x: snappedX, y: snappedY };
    }
    return pos;
};


export const findElementByPoint = (x, y, geometries, waypoints, exits, distributions) => {
    for (const w of waypoints) {
        if (isPointInCircle(x, y, w.x, w.y, w.radius)) return { id: w.id, type: "waypoint", x: w.x, y: w.y };
    }
    for (const e of exits) {
        const centerX = e.x + e.width / 2;
        const centerY = e.y + e.height / 2;
        if (x >= e.x && x <= e.x + e.width && y >= e.y && y <= e.y + e.height) {
            return { id: e.id, type: "exit", x: centerX, y: centerY };
        }
    }
    for (const d of distributions) {
        const centerX = d.x + d.width / 2;
        const centerY = d.y + d.height / 2;
        if (x >= d.x && x <= d.x + d.width && y >= d.y && y <= d.y + d.height) {
            return { id: d.id, type: "distribution", x: centerX, y: centerY };
        }
    }
    for (const g of geometries) {
        if (isPointInPolygon(x, y, g.points)) {
            return { id: g.id, type: "geometry" };
        }
    }
    return null;
};

