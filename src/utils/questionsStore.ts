// Хранилище вопросов в IndexedDB.
// localStorage ограничен ~5 МБ, а вопросы содержат base64-картинки из .docx
// и легко выходят за лимит (QuotaExceededError). IndexedDB вмещает сотни МБ.

const DB_NAME = 'tester';
const STORE_NAME = 'kv';
const QUESTIONS_KEY = 'questions';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const idbSet = async <T>(key: string, value: T): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
};

const idbGet = async <T>(key: string): Promise<T | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => {
      db.close();
      resolve(request.result as T | undefined);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

export const saveQuestions = <T>(questions: T[]): Promise<void> => {
  return idbSet(QUESTIONS_KEY, questions);
};

export const loadQuestions = async <T>(): Promise<T[]> => {
  const value = await idbGet<T[]>(QUESTIONS_KEY);
  return value ?? [];
};
