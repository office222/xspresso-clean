// Xspresso File Registry Helpers v2

export function normalizeFilename(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildUniqueFilename(prefix, label, ext = 'txt') {
  const safePrefix = normalizeFilename(prefix || 'xspresso');
  const safeLabel = normalizeFilename(label || 'file');
  const stamp = Date.now();
  return `${safePrefix}_${stamp}_${safeLabel}.${ext}`;
}

export function registerFile(registry = [], file) {
  const name = file?.name || 'unnamed';
  if (registry.some((entry) => entry.name === name)) {
    return registry;
  }
  return [...registry, { ...file, name }];
}

export function buildRegistryIndex(files = []) {
  return files.map((file) => ({
    name: file.name,
    type: file.type || 'unknown',
    purpose: file.purpose || 'working file',
  }));
}
