import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Filesystem, Directory } from '@capacitor/filesystem';
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

  static async scheduleAlarm(lecture: Lecture, settings: Settings): Promise<number[]> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          console.error('Notification permissions not granted');
          return [];
        }
      }

      const notificationIds: number[] = [];
      const alarmMinutes = lecture.alarmMinutesBefore ?? 7;
      
      // Schedule alarm before lecture time
      const alarmTime = this.calculateAlarmTime(lecture, alarmMinutes);
      if (alarmTime && alarmTime > new Date()) {
        const notificationId = Math.floor(Math.random() * 100000000);
        
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notificationId,
              title: lecture.type === 'lecture' ? '🔔 محاضرة قريبة' : '📚 سيكشن قريب',
              body: `${lecture.name} - سيبدأ في ${alarmMinutes} دقيقة`,
              schedule: { at: alarmTime },
              sound: settings.alarmSound || undefined,
              actionTypeId: 'LECTURE_ALARM',
              extra: {
                lectureId: lecture.id,
                lectureName: lecture.name,
                startTime: lecture.startTime,
              },
            },
          ],
        });
        
        notificationIds.push(notificationId);
        console.log(`Alarm scheduled for ${lecture.name} at ${alarmTime.toISOString()}`);
      }

      // Schedule alarm at lecture time if enabled
      if (lecture.alarmAtLectureTime) {
        const lectureTime = this.calculateAlarmTime(lecture, 0);
        if (lectureTime && lectureTime > new Date()) {
          const notificationId = Math.floor(Math.random() * 100000000);
          
          await LocalNotifications.schedule({
            notifications: [
              {
                id: notificationId,
                title: lecture.type === 'lecture' ? '📚 بدأت المحاضرة الآن!' : '✍️ بدأ السيكشن الآن!',
                body: `${lecture.name} - الوقت: ${lecture.startTime}`,
                schedule: { at: lectureTime },
                sound: settings.alarmSound || undefined,
                actionTypeId: 'LECTURE_START',
                extra: {
                  lectureId: lecture.id,
                  lectureName: lecture.name,
                  startTime: lecture.startTime,
                },
              },
            ],
          });
          
          notificationIds.push(notificationId);
          console.log(`Start alarm scheduled for ${lecture.name} at ${lectureTime.toISOString()}`);
        }
      }
      
      return notificationIds;
    } catch (error) {
      console.error('Error scheduling alarm:', error);
      return [];
    }
  }

  static async pickCustomRingtone(): Promise<string | null> {
    try {
      // On Android, use file picker to select ringtone
      // This is a placeholder - actual implementation would require native plugin
      return 'custom_ringtone.mp3';
    } catch (error) {
      console.error('Error picking ringtone:', error);
      return null;
    }
  }

  static async cancelAlarm(notificationIds: number | number[]): Promise<void> {
    try {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      await LocalNotifications.cancel({ 
        notifications: ids.map(id => ({ id }))
      });
      console.log(`Alarms cancelled: ${ids.join(', ')}`);
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
