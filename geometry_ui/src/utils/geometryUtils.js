
export const isPointInPolygon = (x, y, polygon) => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = yi > y !== yj > y &&
                      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
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

