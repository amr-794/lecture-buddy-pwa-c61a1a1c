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
import { Clock, Calendar, Palette, Pencil, Trash2, Paperclip, Download, ExternalLink, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const { t, language } = useLanguage();

  if (!lecture) return null;

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      let url: string | null = null;
      if (attachment.id) {
        const { getAttachmentBlob } = await import('@/utils/idb');
        const blob = await getAttachmentBlob(attachment.id);
        if (blob) url = URL.createObjectURL(blob);
      } else if (attachment.data) {
        url = attachment.data;
      }
      if (!url) return;
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      link.click();
      if (attachment.id) setTimeout(() => URL.revokeObjectURL(url!), 200);
    } catch {}
  };

  const openAttachment = async (attachment: Attachment) => {
    try {
      let url: string | null = null;
      if (attachment.id) {
        const { getAttachmentBlob } = await import('@/utils/idb');
        const blob = await getAttachmentBlob(attachment.id);
        if (blob) url = URL.createObjectURL(blob);
      } else if (attachment.data) {
        url = attachment.data;
      }
      if (!url) return;
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      if (attachment.id) setTimeout(() => URL.revokeObjectURL(url!), 200);
    } catch {}
  };

  // Open with other apps (native share)
  const openWithOtherApp = async (attachment: Attachment) => {
    try {
      let blob: Blob | null = null;
      if (attachment.id) {
        const { getAttachmentBlob } = await import('@/utils/idb');
        blob = await getAttachmentBlob(attachment.id);
      } else if (attachment.data) {
        const res = await fetch(attachment.data);
        blob = await res.blob();
      }
      if (!blob) return;
      
      const file = new File([blob], attachment.name, { type: attachment.type });
      
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        // Fallback: download and let user open
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch {}
  };

  // Export single lecture with attachments
  const exportSingleLecture = async () => {
    try {
      const { getAttachmentAsDataURL } = await import('@/utils/idb');
      const lectureToExport = { ...lecture };
      
      if (lectureToExport.attachments && lectureToExport.attachments.length) {
        const transformedAtts = await Promise.all(
          lectureToExport.attachments.map(async (att: any) => {
            if (att.id) {
              const dataUrl = await getAttachmentAsDataURL(att.id);
              return dataUrl ? { ...att, data: dataUrl } : null;
            }
            return att.data ? att : null;
          })
        );
        lectureToExport.attachments = transformedAtts.filter(Boolean) as any;
      }

      const dataStr = JSON.stringify([lectureToExport]);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${lecture.name}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(language === 'ar' ? 'تم تصدير المحاضرة' : 'Lecture exported');
    } catch {
      toast.error(language === 'ar' ? 'فشل التصدير' : 'Export failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-w-[95vw] w-[95vw] sm:w-full animate-slide-up max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="truncate">{t('lectureDetails')}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4">
            <div
              className="w-full h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: lecture.color }}
            />

            <div className="min-w-0">
              <h3 className="text-xl font-bold mb-2 truncate" title={lecture.name}>{lecture.name}</h3>
              <p className="text-sm text-muted-foreground">
                {t(lecture.type === 'lecture' ? 'lecture' : 'section')}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{t('day')}</p>
                  <p className="font-semibold">{t(days[lecture.day])}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{t('startTime')}</p>
                  <p className="font-semibold">{lecture.startTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{t('endTime')}</p>
                  <p className="font-semibold">{lecture.endTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Palette className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{t('color')}</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border flex-shrink-0"
                      style={{ backgroundColor: lecture.color }}
                    />
                    <p className="font-semibold text-xs truncate">{lecture.color}</p>
                  </div>
                </div>
              </div>

              {lecture.attachments && lecture.attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-sm font-semibold">{t('attachments')}</p>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {lecture.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors min-w-0"
                      >
                        <span 
                          className="truncate flex-1 min-w-0 max-w-[120px]" 
                          title={attachment.name}
                        >
                          {attachment.name}
                        </span>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openAttachment(attachment)}
                            title={language === 'ar' ? 'عرض' : 'View'}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openWithOtherApp(attachment)}
                            title={t('openWithOtherApp')}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => downloadAttachment(attachment)}
                            title={language === 'ar' ? 'تحميل' : 'Download'}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-2 flex-shrink-0 pt-2">
          <Button
            variant="secondary"
            onClick={exportSingleLecture}
            className="flex-1"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('exportSingleLecture')}
          </Button>
          <div className="flex gap-2 flex-1">
            <Button
              variant="outline"
              onClick={onEdit}
              className="flex-1"
              size="sm"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              {t('addAttachment')}
            </Button>
            <Button
              variant="outline"
              onClick={onEdit}
              className="flex-1"
              size="sm"
            >
              <Pencil className="w-4 h-4 mr-2" />
              {t('edit')}
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              className="flex-1"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('delete')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LectureDetailsDialog;
