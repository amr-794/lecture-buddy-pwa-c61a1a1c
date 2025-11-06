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
          {days.map((day, dayIndex) => {
            const dayLectures = lectures.filter((l) => l.day === dayIndex);
            const startOfDay = 7 * 60; // 7:00 AM
            const totalMinutes = timeSlots.length * 60; // 14 hours = 840 minutes
            const isEvenRow = dayIndex % 2 === 0;

            return (
              <div key={day.key} className={`grid gap-1 ${language === 'ar' ? 'grid-cols-[80px_repeat(14,1fr)]' : 'grid-cols-[80px_repeat(14,1fr)]'}`}>
                {/* Day label */}
                <div 
                  className={`h-16 flex items-center justify-center text-xs text-muted-foreground font-semibold bg-muted/50 rounded-lg z-50 ${
                    language === 'ar' ? 'sticky right-0' : 'sticky left-0'
                  }`}
                >
                  {t(day.key)}
                </div>

                {/* Timeline background cells with lectures overlay */}
                {timeSlots.map((hour, hourIndex) => {
                  // Calculate which lectures appear in this hour slot
                  const cellStartMin = hour * 60; // e.g., 7:00 = 420 min
                  const cellEndMin = (hour + 1) * 60; // e.g., 8:00 = 480 min

                  return (
                    <div key={`${day.key}-${hour}`} className="relative h-16">
                      {/* Background cell */}
                      <div className={`absolute inset-0 border border-border/50 rounded-lg ${
                        isEvenRow 
                          ? 'bg-card/30 dark:bg-primary/5' 
                          : 'bg-card/50 dark:bg-secondary/5'
                      }`} />
                      
                      {/* Render lectures that START in this hour */}
                      {dayLectures
                        .filter(lecture => {
                          const [sh] = lecture.startTime.split(':').map(Number);
                          return sh === hour;
                        })
                        .map((lecture, lectureIndex) => {
                          const [sh, sm] = lecture.startTime.split(':').map(Number);
                          const [eh, em] = lecture.endTime.split(':').map(Number);
                          const startMin = sh * 60 + sm;
                          const endMin = eh * 60 + em;
                          const durationMin = endMin - startMin;

                          // Calculate position within the entire day timeline
                          const offsetFromDayStart = startMin - startOfDay; // minutes from 7:00
                          const offsetFromCellStart = startMin - cellStartMin; // minutes from current hour start
                          
                          // Position within this cell (0-100%)
                          const leftPctInCell = (offsetFromCellStart / 60) * 100;
                          
                          // Width spanning multiple cells
                          const cellWidth = 100; // each cell is 100% of its grid column
                          const durationInCells = durationMin / 60;
                          const widthPct = durationInCells * cellWidth;
                          
                          // Calculate how many cells to span (for positioning)
                          const gapSize = 4; // gap-1 = 4px
                          const spanCells = Math.ceil(durationInCells);
                          const totalWidth = `calc(${widthPct}% + ${(spanCells - 1) * gapSize}px)`;

                          return (
                            <Card
                              key={lecture.id}
                              className="absolute inset-y-1 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg overflow-hidden animate-slide-up border-2 border-white/20"
                              style={{
                                backgroundColor: lecture.color,
                                width: totalWidth,
                                ...(language === 'ar' 
                                  ? { right: `${100 - leftPctInCell}%` }
                                  : { left: `${leftPctInCell}%` }
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;
