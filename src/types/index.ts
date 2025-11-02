export type LectureType = 'lecture' | 'section';

export interface Lecture {
  id: string;
  name: string;
  type: LectureType;
  day: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  color: string;
  notificationEnabled: boolean;
  notificationMinutes: number; // minutes before lecture
}

export interface Settings {
  language: 'ar' | 'en';
  theme: 'light' | 'dark';
  notificationSound: string;
}
