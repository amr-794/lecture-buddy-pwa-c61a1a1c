export type LectureType = 'lecture' | 'section';

export interface Attachment {
  id?: string; // IDB key for stored blob
  name: string;
  type: string; // MIME type
  size?: number;
  data?: string; // optional base64 for export/import
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
