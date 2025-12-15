import { useEffect } from 'react';
import { Lecture } from '@/types';

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
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch {
    return false;
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

// Send web notification - uses system notification sound (ringer volume, not media)
const sendNotification = (title: string, body: string) => {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, { 
        body, 
        icon: '/icon-192.png',
        tag: `lecture-${Date.now()}`,
        requireInteraction: true,
        silent: false, // Use system notification sound (ringer volume)
      });
      
      // Vibrate when notification shows
      notification.onshow = () => {
        vibratePattern();
      };
    }
  } catch {
    // ignore
  }
};

// Test notification function - uses system sound
export const testNotification = async () => {
  const permitted = await requestNotificationPermission();
  if (!permitted) {
    return false;
  }
  
  sendNotification(
    'اختبار الإشعار - Test',
    'هذا إشعار تجريبي! This is a test notification!'
  );
  
  vibratePattern();
  
  return true;
};

export const useLectureNotifications = (lectures: Lecture[]) => {
  useEffect(() => {
    if (!lectures || lectures.length === 0) return;

    let cancelled = false;
    const notified = new Set<string>();

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

            sendNotification(title, body);
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
