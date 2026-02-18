/**
 * IndexedDB 저장소 - 오프라인 사진 업로드 지원
 */

const DB_NAME = 'closetbiz';
const DB_VERSION = 1;
const STORE_NAME = 'pending_uploads';

export interface PendingUpload {
  id: string;
  orderId: string;
  file: File;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async addPendingUpload(upload: PendingUpload): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(upload);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingUploads(): Promise<PendingUpload[]> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePendingUpload(upload: PendingUpload): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(upload);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deletePendingUpload(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingUploads(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const idbStorage = new IndexedDBStorage();
