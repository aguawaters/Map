export function hasLonLat(value) {
  return !!value && Number.isFinite(value.lon) && Number.isFinite(value.lat);
}

export function normalizeLon(lon) {
  let out = lon;
  while (out > 180) out -= 360;
  while (out < -180) out += 360;
  return out;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function seededUnit(key) {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

export function formatClock(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function countBy(items, getKey) {
  return Object.entries(
    items.reduce((acc, item) => {
      const key = getKey(item);
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
