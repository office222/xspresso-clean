xspresso_backup_service_v1.js

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, basename, join, resolve } from "node:path";

function fail(message, code = "BACKUP_ERROR", status = 400) {
  return Object.assign(new Error(message), { code, status });
}

function parseKey(value) {
  const key = Buffer.from(String(value || ""), "base64");
  if (key.length !== 32) {
    throw fail("Backup key must be 32 bytes encoded as base64.", "INVALID_BACKUP_KEY");
  }
  return key;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export class XspressoBackupService {
  constructor({
    dataFile,
    backupDir,
    encryptionKey,
    maxBackups = 20,
    clock = Date.now,
  }) {
    if (!dataFile || !backupDir) {
      throw new TypeError("dataFile and backupDir are required.");
    }
    this.dataFile = resolve(dataFile);
    this.backupDir = resolve(backupDir);
    this.key = parseKey(encryptionKey);
    this.maxBackups = Math.max(1, Math.min(100, Number(maxBackups) || 20));
    this.clock = clock;
  }

  #validName(name) {
    const value = String(name || "");
    return value === basename(value)
      && /^xspresso-backup-[A-Za-z0-9._-]+\.json\.enc$/.test(value);
  }

  #backupPath(name) {
    if (!this.#validName(name)) {
      throw fail("Invalid backup filename.", "INVALID_BACKUP_NAME");
    }
    const path = resolve(this.backupDir, name);
    if (!path.startsWith(`${this.backupDir}/`)) {
      throw fail("Invalid backup path.", "INVALID_BACKUP_NAME");
    }
    return path;
  }

  async #atomicWrite(path, bytes) {
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    const tempPath = `${path}.${randomBytes(8).toString("hex")}.tmp`;
    try {
      await writeFile(tempPath, bytes, { flag: "wx", mode: 0o600 });
      await rename(tempPath, path);
    } catch (error) {
      await rm(tempPath, { force: true }).catch(() => {});
      throw error;
    }
  }

  #encrypt(raw, createdAt) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(raw), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.from(JSON.stringify({
      format: "xspresso-encrypted-backup-v1",
      createdAt,
      sha256: createHash("sha256").update(raw).digest("hex"),
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      ciphertext: ciphertext.toString("base64"),
    }));
  }

  #decrypt(envelopeBytes) {
    let envelope;
    try {
      envelope = JSON.parse(envelopeBytes.toString("utf8"));
    } catch {
      throw fail("Backup file is not valid JSON.", "INVALID_BACKUP");
    }

    if (envelope?.format !== "xspresso-encrypted-backup-v1") {
      throw fail("Unsupported backup format.", "INVALID_BACKUP_FORMAT");
    }

    try {
      const decipher = createDecipheriv(
        "aes-256-gcm",
        this.key,
        Buffer.from(envelope.iv, "base64"),
      );
      decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
      const raw = Buffer.concat([
        decipher.update(Buffer.from(envelope.ciphertext, "base64")),
        decipher.final(),
      ]);

      const digest = createHash("sha256").update(raw).digest("hex");
      if (digest !== envelope.sha256) {
        throw fail("Backup checksum does not match.", "BACKUP_CHECKSUM_FAILED");
      }

      const data = JSON.parse(raw.toString("utf8"));
      if (!isPlainObject(data)) {
        throw fail("Backup database must be a JSON object.", "INVALID_BACKUP_DATA");
      }

      return { raw, data, createdAt: envelope.createdAt, sha256: digest };
    } catch (error) {
      if (error?.code) throw error;
      throw fail("Could not decrypt backup; check the encryption key.", "BACKUP_DECRYPT_FAILED");
    }
  }

  async createBackup() {
    const raw = await readFile(this.dataFile);
    let data;
    try {
      data = JSON.parse(raw.toString("utf8"));
    } catch {
      throw fail("Current database is not valid JSON; refusing to back it up.", "INVALID_STORE");
    }
    if (!isPlainObject(data)) {
      throw fail("Current database must be a JSON object.", "INVALID_STORE");
    }

    const createdAt = new Date(this.clock()).toISOString();
    const stamp = createdAt.replace(/[:.]/g, "-");
    const nonce = randomBytes(4).toString("hex");
    const name = `xspresso-backup-${stamp}-${nonce}.json.enc`;
    const path = this.#backupPath(name);

    await mkdir(this.backupDir, { recursive: true, mode: 0o700 });
    await this.#atomicWrite(path, this.#encrypt(raw, createdAt));
    await this.#prune();

    return {
      filename: name,
      createdAt,
      bytes: raw.length,
      sha256: createHash("sha256").update(raw).digest("hex"),
    };
  }

  async listBackups() {
    await mkdir(this.backupDir, { recursive: true, mode: 0o700 });
    const names = await readdir(this.backupDir);
    const backups = [];

    for (const name of names) {
      if (!this.#validName(name)) continue;
      const info = await stat(this.#backupPath(name)).catch(() => null);
      if (!info?.isFile()) continue;
      backups.push({ filename: name, bytes: info.size, modifiedAt: info.mtime.toISOString() });
    }

    return backups.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  }

  async verifyBackup(filename) {
    const path = this.#backupPath(filename);
    const file = await readFile(path);
    const result = this.#decrypt(file);
    return {
      valid: true,
      filename,
      createdAt: result.createdAt,
      sha256: result.sha256,
      bytes: result.raw.length,
    };
  }

  async restoreBackup(filename, { confirmed = false } = {}) {
    if (!confirmed) {
      throw fail("Restore requires explicit confirmation.", "RESTORE_CONFIRMATION_REQUIRED", 409);
    }

    const backupPath = this.#backupPath(filename);
    const verified = this.#decrypt(await readFile(backupPath));

    // Preserve the current store before replacing it.
    await access(this.dataFile).then(
      () => this.createBackup(),
      () => undefined,
    );

    await mkdir(dirname(this.dataFile), { recursive: true, mode: 0o700 });
    await this.#atomicWrite(this.dataFile, verified.raw);

    return {
      restored: true,
      filename,
      createdAt: verified.createdAt,
      sha256: verified.sha256,
      restartRequired: true,
    };
  }

  async #prune() {
    const backups = await this.listBackups();
    for (const backup of backups.slice(this.maxBackups)) {
      await rm(this.#backupPath(backup.filename), { force: true });
    }
  }
}
