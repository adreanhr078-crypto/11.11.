import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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
