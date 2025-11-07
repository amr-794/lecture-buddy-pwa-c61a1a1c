import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Lecture, Settings } from '@/types';

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async checkPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  static async scheduleAlarm(lecture: Lecture, settings: Settings): Promise<number | null> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          console.error('Notification permissions not granted');
          return null;
        }
      }

      // Calculate the alarm time
      const alarmMinutes = lecture.alarmMinutesBefore ?? settings.defaultAlarmMinutes ?? 7;
      const alarmTime = this.calculateAlarmTime(lecture, alarmMinutes);

      if (!alarmTime || alarmTime <= new Date()) {
        console.log('Alarm time is in the past, skipping');
        return null;
      }

      const notificationId = Math.floor(Math.random() * 100000000);

      const scheduleOptions: ScheduleOptions = {
        notifications: [
          {
            id: notificationId,
            title: lecture.type === 'lecture' ? '🔔 محاضرة قريبة' : '📚 سيكشن قريب',
            body: `${lecture.name} - سيبدأ في ${alarmMinutes} دقيقة (${lecture.startTime})`,
            schedule: { at: alarmTime },
            sound: settings.alarmSound === 'default' ? 'beep.wav' : undefined,
            actionTypeId: 'LECTURE_ALARM',
            extra: {
              lectureId: lecture.id,
              lectureName: lecture.name,
              startTime: lecture.startTime,
            },
          },
        ],
      };

      await LocalNotifications.schedule(scheduleOptions);
      
      console.log(`Alarm scheduled for ${lecture.name} at ${alarmTime.toISOString()}`);
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling alarm:', error);
      return null;
    }
  }

  static async cancelAlarm(notificationId: number): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      console.log(`Alarm ${notificationId} cancelled`);
    } catch (error) {
      console.error('Error cancelling alarm:', error);
    }
  }

  static async cancelAllAlarms(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ 
          notifications: pending.notifications.map(n => ({ id: n.id })) 
        });
      }
      console.log('All alarms cancelled');
    } catch (error) {
      console.error('Error cancelling all alarms:', error);
    }
  }

  static async rescheduleAllAlarms(lectures: Lecture[], settings: Settings): Promise<void> {
    try {
      // Cancel all existing alarms
      await this.cancelAllAlarms();

      // Schedule new alarms for lectures that have alarm enabled
      for (const lecture of lectures) {
        if (lecture.alarmEnabled) {
          await this.scheduleAlarm(lecture, settings);
        }
      }

      console.log('All alarms rescheduled');
    } catch (error) {
      console.error('Error rescheduling alarms:', error);
    }
  }

  static async triggerVibration(pattern: 'short' | 'medium' | 'long' | 'custom' = 'medium'): Promise<void> {
    try {
      switch (pattern) {
        case 'short':
          await Haptics.vibrate({ duration: 200 });
          break;
        case 'medium':
          await Haptics.vibrate({ duration: 500 });
          break;
        case 'long':
          await Haptics.vibrate({ duration: 1000 });
          break;
        case 'custom':
          // Custom vibration pattern: vibrate 3 times
          for (let i = 0; i < 3; i++) {
            await Haptics.vibrate({ duration: 300 });
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          break;
      }
    } catch (error) {
      console.error('Error triggering vibration:', error);
    }
  }

  static async testNotification(settings: Settings): Promise<void> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        await this.requestPermissions();
      }

      const testId = Math.floor(Math.random() * 100000000);
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id: testId,
            title: 'اختبار المنبه',
            body: 'هذا اختبار للتأكد من عمل المنبه بشكل صحيح',
            schedule: { at: new Date(Date.now() + 2000) }, // 2 seconds from now
            sound: settings.alarmSound === 'default' ? 'beep.wav' : undefined,
          },
        ],
      });

      if (settings.vibrationEnabled) {
        setTimeout(() => {
          this.triggerVibration(settings.vibrationPattern || 'medium');
        }, 2000);
      }
    } catch (error) {
      console.error('Error testing notification:', error);
    }
  }

  private static calculateAlarmTime(lecture: Lecture, minutesBefore: number): Date | null {
    try {
      const now = new Date();
      const currentDay = now.getDay();
      
      // Parse lecture time
      const [hours, minutes] = lecture.startTime.split(':').map(Number);
      
      // Calculate days until the lecture
      let daysUntil = lecture.day - currentDay;
      if (daysUntil < 0) {
        daysUntil += 7; // Next week
      } else if (daysUntil === 0) {
        // Check if the time has passed today
        const lectureTimeToday = new Date(now);
        lectureTimeToday.setHours(hours, minutes, 0, 0);
        
        if (lectureTimeToday <= now) {
          daysUntil = 7; // Schedule for next week
        }
      }
      
      const alarmDate = new Date(now);
      alarmDate.setDate(now.getDate() + daysUntil);
      alarmDate.setHours(hours, minutes - minutesBefore, 0, 0);
      
      return alarmDate;
    } catch (error) {
      console.error('Error calculating alarm time:', error);
      return null;
    }
  }
}
