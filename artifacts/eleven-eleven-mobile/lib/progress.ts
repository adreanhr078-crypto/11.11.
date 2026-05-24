// ARG Progression System — mobile utility
// Manages a server-issued UUID (stored in AsyncStorage) for cross-device level progress
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "./api";

const SERVER_UID_KEY = "eleven_server_uid";

let _cachedUid: string | null = null;

export async function getServerUid(): Promise<string | null> {
  if (_cachedUid) return _cachedUid;
  const base = getApiBaseUrl();
  if (!base) return null;

  try {
    // Check AsyncStorage for a previously minted UUID
    const stored = await AsyncStorage.getItem(SERVER_UID_KEY);
    if (stored) { _cachedUid = stored; return stored; }

    // Mint a new one via the API
    const res = await fetch(`${base}/api/user/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) return null;
    const data = await res.json() as { uid?: string };
    if (!data.uid) return null;

    await AsyncStorage.setItem(SERVER_UID_KEY, data.uid);
    _cachedUid = data.uid;
    return data.uid;
  } catch {
    return null;
  }
}

export interface LevelProgress {
  currentLevel: number;
  isCompleted: boolean;
}

export async function fetchLevelProgress(): Promise<LevelProgress | null> {
  const uid = await getServerUid();
  if (!uid) return null;
  const base = getApiBaseUrl();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/api/progress?uid=${uid}`);
    if (!res.ok) return null;
    return await res.json() as LevelProgress;
  } catch {
    return null;
  }
}
