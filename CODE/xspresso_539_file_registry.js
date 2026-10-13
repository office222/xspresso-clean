// Xspresso File Registry Helpers
// Keeps filenames unique and tracks generated artifacts.

export const registry = [];

export function normalizeName(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function isUniqueFileName(name) {
  const normalized = normalizeName(name);
  return !registry.some(item => item.normalized === normalized);
}

export function registerFile(name, meta = {}) {
  const normalized = normalizeName(name);
  const exists = registry.some(item => item.normalized === normalized);
  if (exists) {
    return { success: false, message: 'Filename already exists.', name };
  }

  const entry = {
    name,
    normalized,
    createdAt: new Date().toISOString(),
    ...meta,
  };
  registry.push(entry);
  return { success: true, entry };
}

export function listFiles() {
  return [...registry];
}

export function suggestNextFileName(prefix = 'xspresso', topic = 'new_file') {
  const base = `${prefix}_${normalizeName(topic)}`;
  if (isUniqueFileName(`${base}.js`)) return `${base}.js`;

  let i = 2;
  while (!isUniqueFileName(`${base}_${i}.js`)) i += 1;
  return `${base}_${i}.js`;
}
