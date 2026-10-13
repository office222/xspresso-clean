// xspresso_432_file_registry_helpers.js
// File registry helpers to avoid duplicate naming and keep Xspresso organized

export function makeFileRegistry() {
  return {
    files: [],
    byName: {},
  };
}

export function normalizeFileName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/_+/g, "_");
}

export function isDuplicateName(registry, name) {
  const normalized = normalizeFileName(name);
  return Boolean(registry.byName[normalized]);
}

export function registerFile(registry, file) {
  const normalized = normalizeFileName(file.name);

  if (registry.byName[normalized]) {
    return {
      ok: false,
      reason: "duplicate_name",
      existing: registry.byName[normalized],
    };
  }

  const record = {
    ...file,
    id: file.id || `file_${Date.now()}`,
    normalizedName: normalized,
    createdAt: file.createdAt || new Date().toISOString(),
  };

  registry.files.push(record);
  registry.byName[normalized] = record;

  return { ok: true, file: record };
}

export function listRegistryFiles(registry) {
  return [...registry.files].sort((a, b) => a.name.localeCompare(b.name));
}

export function buildSuggestedFileName(prefix, topic, ext = "js") {
  const safePrefix = normalizeFileName(prefix || "xspresso");
  const safeTopic = normalizeFileName(topic || "file");
  return `${safePrefix}_${safeTopic}.${ext}`;
}
