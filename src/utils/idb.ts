// Minimal IndexedDB utilities for large attachments and profile image storage
// Stores binary blobs so files persist across reloads and PWA with sizes up to 100MB+

const DB_NAME = 'college-alarm-db';
const DB_VERSION = 1;
const ATTACHMENTS_STORE = 'attachments';
const PROFILE_STORE = 'profile';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ATTACHMENTS_STORE)) {
        db.createObjectStore(ATTACHMENTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txStore(db: IDBDatabase, store: string, mode: IDBTransactionMode = 'readonly') {
  return db.transaction(store, mode).objectStore(store);
}

export async function addAttachment(file: File): Promise<{ id: string; name: string; type: string; size: number }>{
  const db = await openDB();
  const id = crypto.randomUUID();
  const rec = { id, name: file.name, type: file.type, size: file.size, data: file } as any;
  await new Promise<void>((resolve, reject) => {
    const req = txStore(db, ATTACHMENTS_STORE, 'readwrite').add(rec);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  db.close();
  return { id, name: file.name, type: file.type, size: file.size };
}

export async function deleteAttachment(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const req = txStore(db, ATTACHMENTS_STORE, 'readwrite').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  db.close();
}

export async function getAttachmentBlob(id: string): Promise<Blob | null> {
  const db = await openDB();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const req = txStore(db, ATTACHMENTS_STORE).get(id);
    req.onsuccess = () => {
      const val: any = req.result;
      resolve(val?.data ?? null);
    };
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

export async function getAttachmentAsDataURL(id: string): Promise<string | null> {
  const blob = await getAttachmentBlob(id);
  if (!blob) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Profile image helpers
const PROFILE_IMAGE_ID_KEY = 'profileImageId';

export async function setProfileImageFile(file: File): Promise<string> {
  const db = await openDB();
  const id = 'current-profile-image';
  const rec = { id, name: file.name, type: file.type, size: file.size, data: file } as any;
  await new Promise<void>((resolve, reject) => {
    const req = txStore(db, PROFILE_STORE, 'readwrite').put(rec);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  db.close();
  localStorage.setItem(PROFILE_IMAGE_ID_KEY, id);
  const url = URL.createObjectURL(file);
  return url;
}

export async function getProfileImageURL(): Promise<string | null> {
  const id = localStorage.getItem(PROFILE_IMAGE_ID_KEY) || 'current-profile-image';
  const db = await openDB();
  const record = await new Promise<any>((resolve, reject) => {
    const req = txStore(db, PROFILE_STORE).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!record?.data) return null;
  return URL.createObjectURL(record.data as Blob);
}

export async function deleteProfileImageIDB(): Promise<void> {
  const id = localStorage.getItem(PROFILE_IMAGE_ID_KEY) || 'current-profile-image';
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const req = txStore(db, PROFILE_STORE, 'readwrite').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  db.close();
  localStorage.removeItem(PROFILE_IMAGE_ID_KEY);
}

// Optional migration: if legacy base64 exists, migrate to IDB
export async function migrateLegacyProfileBase64IfAny(): Promise<void> {
  const legacy = localStorage.getItem('profileImage');
  if (!legacy) return;
  try {
    const res = await fetch(legacy);
    const blob = await res.blob();
    await setProfileImageFile(new File([blob], 'profile.png', { type: blob.type || 'image/png' }));
    localStorage.removeItem('profileImage');
  } catch {
    // ignore
  }
}
