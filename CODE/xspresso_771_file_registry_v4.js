export function buildFileRegistry(files = []) {
  const registry = new Map();

  files.forEach(file => {
    if (!file || !file.name) return;
    registry.set(file.name, {
      ...file,
      seenAt: file.seenAt || new Date().toISOString()
    });
  });

  return registry;
}

export function ensureUniqueName(name, existingNames = []) {
  if (!existingNames.includes(name)) return name;

  const extIndex = name.lastIndexOf('.');
  const base = extIndex > -1 ? name.slice(0, extIndex) : name;
  const ext = extIndex > -1 ? name.slice(extIndex) : '';

  let counter = 2;
  let candidate = `${base}_${counter}${ext}`;
  while (existingNames.includes(candidate)) {
    counter += 1;
    candidate = `${base}_${counter}${ext}`;
  }

  return candidate;
}
