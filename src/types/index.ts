export type LectureType = 'lecture' | 'section';

export interface Attachment {
  name: string;
  data: string; // base64 or URL
  type: string; // MIME type
}

export interface Lecture {
  id: string;
  name: string;
  type: LectureType;
  day: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  color: string;
  attachments?: Attachment[];
}

export interface Settings {
  language: 'ar' | 'en';
  theme: 'light' | 'dark';
  notificationSound: string;
}

export interface Backup {
  id: string;
  name: string;
  date: string;
  lectures: Lecture[];
}
