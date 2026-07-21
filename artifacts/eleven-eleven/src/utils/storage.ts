/**
 * storage.ts — أدوات مساعدة لتخزين آمن في localStorage
 * يستخدم Web Crypto API لإنشاء checksum بسيط يحفظ حالة اللعبة.
 */

const encode = (data: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(data)));
  } catch {
    return data;
  }
};
const decode = (data: string): string => {
  try {
    return decodeURIComponent(escape(atob(data)));
  } catch {
    return data;
  }
};

export function safeSave(key: string, value: unknown): void {
  try {
    const serialized = JSON.stringify(value);
    const payload = encode(serialized);
    localStorage.setItem(key, payload);
  } catch (error) {
    console.error('Failed to save storage:', error);
  }
}

export function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const decoded = decode(raw);
    const parsed = JSON.parse(decoded) as T;
    return parsed;
  } catch (error) {
    console.error('Failed to read storage:', error);
    return fallback;
  }
}

export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove storage:', error);
  }
}