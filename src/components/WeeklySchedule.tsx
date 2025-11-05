import React from 'react';
import { Lecture } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';

interface WeeklyScheduleProps {
  lectures: Lecture[];
  onLectureClick: (lecture: Lecture) => void;
}

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ lectures, onLectureClick }) => {
  const { t, language } = useLanguage();

  const days = [
    { key: 'sun', full: 'sunday' },
    { key: 'mon', full: 'monday' },
    { key: 'tue', full: 'tuesday' },
    { key: 'wed', full: 'wednesday' },
    { key: 'thu', full: 'thursday' },
    { key: 'fri', full: 'friday' },
    { key: 'sat', full: 'saturday' },
  ];

  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM (7-20)

  const formatTime = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const getLecturesForDayAndHour = (day: number, hour: number): Lecture[] => {
    return lectures.filter(lecture => {
      const [startHour] = lecture.startTime.split(':').map(Number);
      return lecture.day === day && startHour === hour;
    });
  };

  const getLectureHeight = (lecture: Lecture): number => {
    const [startHour, startMinute] = lecture.startTime.split(':').map(Number);
    const [endHour, endMinute] = lecture.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const duration = endMinutes - startMinutes;
    return (duration / 60) * 60; // 60px per hour
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with time slots */}
        <div className="mb-2">
          <div className={`grid gap-1 ${language === 'ar' ? 'grid-cols-[80px_repeat(14,1fr)]' : 'grid-cols-[80px_repeat(14,1fr)]'}`}>
            <div 
              className={`h-12 flex items-center justify-center font-semibold text-sm bg-background z-50 ${
                language === 'ar' ? 'sticky right-0' : 'sticky left-0'
              }`}
            >
              {t('day')}
            </div>
            {timeSlots.map(hour => (
              <div
                key={hour}
                className="h-12 flex items-center justify-center font-semibold text-[10px] bg-primary/10 rounded-lg"
              >
                {formatTime(hour)}
              </div>
            ))}
          </div>
        </div>

        {/* Days and lectures */}
        <div className="space-y-1">
          {days.map((day, dayIndex) => (
            <div key={day.key} className={`grid gap-1 ${language === 'ar' ? 'grid-cols-[80px_repeat(14,1fr)]' : 'grid-cols-[80px_repeat(14,1fr)]'}`}>
              <div 
                className={`h-16 flex items-center justify-center text-xs text-muted-foreground font-semibold bg-muted/50 rounded-lg z-50 ${
                  language === 'ar' ? 'sticky right-0' : 'sticky left-0'
                }`}
              >
                {t(day.key)}
              </div>
              {timeSlots.map((hour, hourIndex) => {
                const dayLectures = getLecturesForDayAndHour(dayIndex, hour);
                const isEvenRow = dayIndex % 2 === 0;
                
                // Check if this cell is already occupied by a lecture that started earlier
                const isOccupied = lectures.some(lecture => {
                  if (lecture.day !== dayIndex) return false;
                  const [lectureStartHour] = lecture.startTime.split(':').map(Number);
                  const [lectureEndHour] = lecture.endTime.split(':').map(Number);
                  return lectureStartHour < hour && lectureEndHour > hour;
                });
                
                return (
                  <div key={`${day.key}-${hour}`} className="relative h-16">
                    <div className={`absolute inset-0 border border-border/50 rounded-lg ${
                      isEvenRow 
                        ? 'bg-card/30 dark:bg-primary/5' 
                        : 'bg-card/50 dark:bg-secondary/5'
                    }`} />
                    {!isOccupied && dayLectures.map((lecture, lectureIndex) => {
                      const [startHour, startMinute] = lecture.startTime.split(':').map(Number);
                      const [endHour, endMinute] = lecture.endTime.split(':').map(Number);
                      const durationInMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
                      const durationInHours = durationInMinutes / 60;
                      const cellsToSpan = Math.ceil(durationInHours);
                      
                      return (
                        <Card
                          key={lecture.id}
                          className="absolute inset-y-1 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg overflow-hidden animate-slide-up border-2 border-white/20"
                          style={{
                            backgroundColor: lecture.color,
                            width: `calc(${cellsToSpan * 100}% + ${(cellsToSpan - 1) * 4}px)`,
                            ...(language === 'ar' 
                              ? { right: 0 }
                              : { left: 0 }
                            ),
                            zIndex: 10 + lectureIndex,
                          }}
                          onClick={() => onLectureClick(lecture)}
                        >
                          <div className="p-2 h-full flex flex-col justify-center items-center text-white">
                            <p className="text-[10px] font-semibold text-center line-clamp-2 drop-shadow-lg">
                              {lecture.name}
                            </p>
                            <p className="text-[8px] opacity-90 mt-0.5">
                              {lecture.startTime} - {lecture.endTime}
                            </p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;
