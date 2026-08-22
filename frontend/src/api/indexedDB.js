/**
 * useIndexedDB — minimal hook for saving/loading a File object across page navigations.
 *
 * Browsers allow storing raw File/Blob objects in IndexedDB (unlike localStorage).
 * We use this to persist the user's selected cover file before redirecting to Polar,
 * so it can be automatically retried after they return from checkout.
 *
 * DB name : "cover_doctor"
 * Store   : "pending_upload"
 * Key     : "file"  → stores { file: File, title: string, bookProjectId: string }
 */

const DB_NAME = 'cover_doctor';
const STORE_NAME = 'pending_upload';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePendingUpload(file, title, bookProjectId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ file, title, bookProjectId, savedAt: Date.now() }, 'file');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadPendingUpload() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get('file');
    req.onsuccess = () => {
      const result = req.result;
      // Treat saved files older than 24 h as stale — don't auto-retry them
      if (result && Date.now() - result.savedAt < 24 * 60 * 60 * 1000) {
        resolve(result);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearPendingUpload() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete('file');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
