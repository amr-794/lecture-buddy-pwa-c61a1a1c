import React from 'react';
import { Lecture } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Clock, Bell } from 'lucide-react';

interface LectureDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lecture: Lecture | null;
  onEdit: () => void;
  onDelete: () => void;
}

const LectureDetailsDialog: React.FC<LectureDetailsDialogProps> = ({
  open,
  onOpenChange,
  lecture,
  onEdit,
  onDelete,
}) => {
  const { t } = useLanguage();

  if (!lecture) return null;

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] animate-slide-up">
        <DialogHeader>
          <DialogTitle>{t('lectureDetails')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="w-full h-3 rounded-full"
            style={{ backgroundColor: lecture.color }}
          />

          <div>
            <h3 className="text-2xl font-bold mb-2">{lecture.name}</h3>
            <p className="text-sm text-muted-foreground">
              {t(lecture.type === 'lecture' ? 'lecture' : 'section')}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('day')}</p>
                <p className="font-semibold">{t(days[lecture.day])}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('startTime')}</p>
                <p className="font-semibold">{lecture.startTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('endTime')}</p>
                <p className="font-semibold">{lecture.endTime}</p>
              </div>
            </div>

            {lecture.notificationEnabled && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('notifyBefore')}</p>
                  <p className="font-semibold">
                    {lecture.notificationMinutes} {t('minutes')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onEdit}
            className="flex-1"
          >
            <Pencil className="w-4 h-4 mr-2" />
            {t('edit')}
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LectureDetailsDialog;
