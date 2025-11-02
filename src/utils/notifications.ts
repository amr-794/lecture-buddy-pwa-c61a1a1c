import { Lecture } from '@/types';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const scheduleNotification = (lecture: Lecture): void => {
  if (!lecture.notificationEnabled) return;

  // Calculate notification time
  const now = new Date();
  const [hours, minutes] = lecture.startTime.split(':').map(Number);
  
  // Find next occurrence of this day
  let daysUntil = lecture.day - now.getDay();
  if (daysUntil < 0) daysUntil += 7;
  
  const notificationDate = new Date(now);
  notificationDate.setDate(now.getDate() + daysUntil);
  notificationDate.setHours(hours, minutes - lecture.notificationMinutes, 0, 0);

  const timeUntilNotification = notificationDate.getTime() - now.getTime();

  if (timeUntilNotification > 0) {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('منبه المحاضرات', {
          body: `${lecture.name} ستبدأ خلال ${lecture.notificationMinutes} دقيقة`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: lecture.id,
          requireInteraction: true,
        });
      }
    }, timeUntilNotification);
  }
};

export const scheduleAllNotifications = (lectures: Lecture[]): void => {
  lectures.forEach(lecture => {
    if (lecture.notificationEnabled) {
      scheduleNotification(lecture);
    }
  });
};
