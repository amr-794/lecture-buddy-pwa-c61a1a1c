import { Lecture, Settings, Backup } from '@/types';

const LECTURES_KEY = 'college-alarm-lectures';
const SETTINGS_KEY = 'college-alarm-settings';
const BACKUPS_KEY = 'college-alarm-backups';

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

export const saveProfileImage = (imageData: string): void => {
  localStorage.setItem('profileImage', imageData);
};

export const loadProfileImage = (): string | null => {
  return localStorage.getItem('profileImage');
};

export const deleteProfileImage = (): void => {
  localStorage.removeItem('profileImage');
};

// Backup functions
export const saveBackups = (backups: Backup[]): void => {
  localStorage.setItem(BACKUPS_KEY, JSON.stringify(backups));
};

export const loadBackups = (): Backup[] => {
  const stored = localStorage.getItem(BACKUPS_KEY);
  return stored ? JSON.parse(stored) : [];
};
