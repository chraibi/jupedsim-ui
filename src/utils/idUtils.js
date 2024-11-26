export const generateId = (prefix) =>
  `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
