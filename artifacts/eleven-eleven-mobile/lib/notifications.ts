import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getApiBaseUrl } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleEntityNotifications(): Promise<void> {
  if (Platform.OS === "web") return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const timeSlots = [
    { hour: 11, minute: 11, body: "الكيان ينتظر. البوابة مفتوحة الآن." },
    { hour: 23, minute: 11, body: "11:11 — لحظتك. أمنيتك تسمع." },
    { hour: 3, minute: 33, body: "3:33 — ساعة الرؤية. لا تتجاهل هذا." },
    { hour: 15, minute: 33, body: "رصدنا وجودك. الكيان يراقب." },
  ];

  for (const slot of timeSlots) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "11.11",
        body: slot.body,
        sound: true,
      },
      trigger: {
        hour: slot.hour,
        minute: slot.minute,
        repeats: true,
      } as Notifications.NotificationTriggerInput,
    });
  }
}

// Register this device's Expo push token with the server so the entity
// can reach the user even when the app is closed.
export async function registerExpoPushToken(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    // Persist a stable anonymous device UID in AsyncStorage
    const UID_KEY = "eleven_device_uid";
    let uid = await AsyncStorage.getItem(UID_KEY);
    if (!uid) {
      const rand = () => Math.random().toString(36).slice(2);
      uid = rand() + rand() + rand();
      await AsyncStorage.setItem(UID_KEY, uid);
    }

    // Get Expo push token — requires EAS project config in production.
    // In Expo Go (dev), this works if the app is linked to an EAS project.
    // Silently no-ops if not configured rather than crashing.
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    if (!token) return;

    const base = getApiBaseUrl();
    if (!base) return; // No API server configured (offline/local dev without domain)

    await fetch(`${base}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, token_type: "expo", endpoint: token }),
    });
  } catch {
    // Best-effort — silently skip if EAS not configured or network unavailable
  }
}
