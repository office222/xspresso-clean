// Xspresso - File Registry Utilities
// Purpose: avoid duplicate file names and keep the project organized.

export function buildSafeFilename(prefix, number, topic, ext = 'txt') {
  const cleanTopic = String(topic || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  return `${prefix}_${String(number).padStart(3, '0')}_${cleanTopic}.${ext}`;
}

export function registerFilename(registry = [], filename) {
  if (!registry.includes(filename)) {
    registry.push(filename);
  }
  return registry;
}

export function filenameExists(registry = [], filename) {
  return registry.includes(filename);
}

export function nextFilenameNumber(registry = [], prefix = 'xspresso') {
  const matches = registry
    .map(name => name.match(new RegExp(`^${prefix}_(\d{3})_`)))
    .filter(Boolean)
    .map(match => Number(match[1]));

  if (!matches.length) return 1;
  return Math.max(...matches) + 1;
}
