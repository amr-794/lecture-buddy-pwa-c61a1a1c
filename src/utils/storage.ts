import { Lecture, Settings } from '@/types';

const LECTURES_KEY = 'college-alarm-lectures';
const SETTINGS_KEY = 'college-alarm-settings';

export const saveLectures = (lectures: Lecture[]): void => {
  localStorage.setItem(LECTURES_KEY, JSON.stringify(lectures));
};

export const loadLectures = (): Lecture[] => {
  const stored = localStorage.getItem(LECTURES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSettings = (): Settings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? JSON.parse(stored) : {
    language: 'ar',
    theme: 'light',
    notificationSound: 'default',
  };
};
