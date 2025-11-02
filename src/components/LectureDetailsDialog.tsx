import React from 'react';
import { Lecture, Attachment } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Palette, Pencil, Trash2, Paperclip, Download } from 'lucide-react';

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

  const downloadAttachment = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.name;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] animate-slide-up max-h-[90vh] overflow-y-auto">
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
                <Calendar className="w-4 h-4 text-primary" />
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

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('color')}</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: lecture.color }}
                  />
                  <p className="font-semibold text-xs">{lecture.color}</p>
                </div>
              </div>
            </div>

            {lecture.attachments && lecture.attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">{t('attachments')}</p>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {lecture.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                    >
                      <span className="truncate flex-1">{attachment.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => downloadAttachment(attachment)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
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
