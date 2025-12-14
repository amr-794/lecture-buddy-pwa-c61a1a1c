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

const playCustomAlarmTone = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0.2; // soft, non-annoying volume
    gain.connect(ctx.destination);

    const scheduleBeep = (start: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Gentle triple-whistle pattern
    scheduleBeep(0, 1200, 0.18);
    scheduleBeep(0.3, 1400, 0.22);
    scheduleBeep(0.7, 1000, 0.3);

    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    }, 2000);
  } catch {
    // ignore audio errors
  }
};

const vibratePattern = () => {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    // Unique, short cascading vibration pattern
    navigator.vibrate([200, 120, 200, 120, 320, 150, 480]);
  } catch {
    // ignore
  }
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
      const todayIndex = now.getDay(); // 0 (Sun) - 6 (Sat)
      const minutesBefore = settings.minutesBefore ?? 10;

      for (const lecture of lectures) {
        if (lecture.day !== todayIndex) continue;
        const [h, m] = lecture.startTime.split(':').map(Number);
        const lectureTime = new Date(now);
        lectureTime.setHours(h, m, 0, 0);
        const diffMs = lectureTime.getTime() - now.getTime();
        const diffMin = diffMs / 60000;

        if (diffMin <= minutesBefore && diffMin >= 0) {
          const key = `${lecture.id}-${lectureTime.toDateString()}`;
          if (notified.has(key)) continue;
          notified.add(key);

          const title = lecture.name || 'Lecture Reminder';
          const body = `${lecture.startTime} - ${lecture.endTime}`;

          try {
            new Notification(title, { body });
          } catch {
            // ignore notification errors
          }

          vibratePattern();
          playCustomAlarmTone();
        }
      }
    };

    // Initial check and interval
    checkAndNotify();
    const interval = window.setInterval(checkAndNotify, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [lectures]);
};
