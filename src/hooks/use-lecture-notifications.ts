import { useEffect } from 'react';
import { Lecture } from '@/types';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface LectureNotificationSettings {
  enabled: boolean;
  minutesBefore: number;
}

export const NOTIFICATION_SETTINGS_KEY = 'lecture-notification-settings';

export const loadNotificationSettings = (): LectureNotificationSettings => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<LectureNotificationSettings>;
      return {
        enabled: parsed.enabled ?? true,
        minutesBefore: parsed.minutesBefore ?? 10,
      };
    }
  } catch {
    // ignore
  }
  return { enabled: true, minutesBefore: 10 };
};

export const saveNotificationSettings = (settings: LectureNotificationSettings) => {
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
};

const requestNotificationPermission = async (): Promise<boolean> => {
  // Try Capacitor local notifications first (for background support)
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') return true;
    if (display === 'denied') {
      // Fall back to web notifications
      if ('Notification' in window && Notification.permission === 'granted') return true;
      return false;
    }
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch {
    // Capacitor not available, use web notifications
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }
};

// Play a 20-second custom alarm tone with repeating pattern
export const playCustomAlarmTone = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    gain.connect(ctx.destination);

    const scheduleBeep = (start: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Repeat the whistle pattern 6 times over 20 seconds
    for (let i = 0; i < 6; i++) {
      const offset = i * 3.3;
      scheduleBeep(offset + 0, 1200, 0.2);
      scheduleBeep(offset + 0.35, 1400, 0.25);
      scheduleBeep(offset + 0.8, 1000, 0.35);
      scheduleBeep(offset + 1.4, 1300, 0.2);
      scheduleBeep(offset + 1.8, 1500, 0.25);
      scheduleBeep(offset + 2.3, 1100, 0.35);
    }

    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    }, 22000);
  } catch {
    // ignore audio errors
  }
};

// Unique cascading vibration pattern
export const vibratePattern = () => {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    // Longer, more noticeable pattern repeated
    navigator.vibrate([
      200, 100, 200, 100, 300, 150, 400, 200,
      200, 100, 200, 100, 300, 150, 400, 200,
      200, 100, 200, 100, 300, 150, 400
    ]);
  } catch {
    // ignore
  }
};

// Schedule background notifications using Capacitor
const scheduleCapacitorNotifications = async (lectures: Lecture[]) => {
  try {
    // Cancel existing scheduled notifications
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    const settings = loadNotificationSettings();
    if (!settings.enabled) return;

    const now = new Date();
    const notifications: any[] = [];
    let notificationId = 1;

    // Schedule for today and next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayOffset);
      const dayIndex = targetDate.getDay();

      for (const lecture of lectures) {
        if (lecture.day !== dayIndex) continue;

        const [h, m] = lecture.startTime.split(':').map(Number);
        
        // Schedule for 10 minutes before
        const tenMinBefore = new Date(targetDate);
        tenMinBefore.setHours(h, m - 10, 0, 0);
        
        // Schedule for 5 minutes before
        const fiveMinBefore = new Date(targetDate);
        fiveMinBefore.setHours(h, m - 5, 0, 0);
        
        // Schedule for lecture start
        const atStart = new Date(targetDate);
        atStart.setHours(h, m, 0, 0);

        const times = [
          { time: tenMinBefore, body: '10 minutes remaining' },
          { time: fiveMinBefore, body: '5 minutes remaining' },
          { time: atStart, body: 'Starting now!' }
        ];

        for (const { time, body } of times) {
          if (time.getTime() > now.getTime()) {
            notifications.push({
              id: notificationId++,
              title: lecture.name || 'Lecture Reminder',
              body: `${body} - ${lecture.startTime}`,
              schedule: { at: time },
              sound: undefined,
              attachments: undefined,
              actionTypeId: '',
              extra: { lectureId: lecture.id }
            });
          }
        }
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch (e) {
    console.log('Capacitor notifications not available, using web fallback');
  }
};

// Send immediate notification
const sendNotification = async (title: string, body: string) => {
  // Try Capacitor first
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: Date.now(),
        title,
        body,
        schedule: { at: new Date(Date.now() + 100) },
        sound: undefined,
        attachments: undefined,
        actionTypeId: '',
        extra: null
      }]
    });
    return;
  } catch {
    // Fall back to web notification
    try {
      new Notification(title, { body });
    } catch {
      // ignore
    }
  }
};

// Test notification function
export const testNotification = async () => {
  const permitted = await requestNotificationPermission();
  if (!permitted) {
    return false;
  }
  
  await sendNotification(
    'Test Notification',
    'This is a test notification with sound and vibration!'
  );
  
  playCustomAlarmTone();
  vibratePattern();
  
  return true;
};

export const useLectureNotifications = (lectures: Lecture[]) => {
  useEffect(() => {
    if (!lectures || lectures.length === 0) return;

    let cancelled = false;
    const notified = new Set<string>();

    // Schedule background notifications via Capacitor
    scheduleCapacitorNotifications(lectures);

    const checkAndNotify = async () => {
      if (cancelled) return;

      const settings = loadNotificationSettings();
      if (!settings.enabled) return;

      const permitted = await requestNotificationPermission();
      if (!permitted) return;

      const now = new Date();
      const todayIndex = now.getDay();

      for (const lecture of lectures) {
        if (lecture.day !== todayIndex) continue;
        const [h, m] = lecture.startTime.split(':').map(Number);
        const lectureTime = new Date(now);
        lectureTime.setHours(h, m, 0, 0);
        const diffMs = lectureTime.getTime() - now.getTime();
        const diffMin = diffMs / 60000;

        // Notify at 10 min, 5 min, and 0 min (start time)
        const alertTimes = [10, 5, 0];
        
        for (const alertMin of alertTimes) {
          if (Math.abs(diffMin - alertMin) <= 0.5) {
            const key = `${lecture.id}-${lectureTime.toDateString()}-${alertMin}`;
            if (notified.has(key)) continue;
            notified.add(key);

            const title = lecture.name || 'Lecture Reminder';
            let body = '';
            if (alertMin === 10) {
              body = `10 minutes remaining - ${lecture.startTime}`;
            } else if (alertMin === 5) {
              body = `5 minutes remaining - ${lecture.startTime}`;
            } else {
              body = `Starting now! - ${lecture.startTime}`;
            }

            await sendNotification(title, body);
            vibratePattern();
            playCustomAlarmTone();
          }
        }
      }
    };

    // Initial check and interval
    checkAndNotify();
    const interval = window.setInterval(checkAndNotify, 20_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [lectures]);
};
