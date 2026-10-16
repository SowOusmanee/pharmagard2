// Temporary Prescription Image Storage Abstraction
// Enforces privacy policy: photos are kept strictly in-memory / temporary storage
// and expire/auto-purge after 10 minutes.

class TemporaryStorageService {
  constructor() {
    this.storage = new Map(); // id -> { dataUrl, createdAt, expiresAt }
    this.TTL_MS = 10 * 60 * 1000; // 10 minutes
  }

  saveTemporaryPrescriptionImage(dataUrl) {
    const id = `img_temp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const createdAt = Date.now();
    const expiresAt = createdAt + this.TTL_MS;

    this.storage.set(id, {
      id,
      dataUrl,
      createdAt,
      expiresAt
    });

    return {
      imageId: id,
      expiresAt,
      ttlMinutes: 10
    };
  }

  getImage(imageId) {
    const item = this.storage.get(imageId);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.storage.delete(imageId);
      return null;
    }
    return item.dataUrl;
  }

  getRemainingTimeMs(imageId) {
    const item = this.storage.get(imageId);
    if (!item) return 0;
    return Math.max(0, item.expiresAt - Date.now());
  }

  purgeExpired() {
    const now = Date.now();
    for (const [id, item] of this.storage.entries()) {
      if (now > item.expiresAt) {
        this.storage.delete(id);
      }
    }
  }

  deleteImage(imageId) {
    this.storage.delete(imageId);
  }
}

export const storageService = new TemporaryStorageService();
