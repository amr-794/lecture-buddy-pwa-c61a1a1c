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
import { Clock, Calendar, Palette, Pencil, Trash2, Paperclip, Share2, ExternalLink } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { toast } from 'sonner';

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

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const shareAttachment = async (attachment: Attachment) => {
    try {
      let blob: Blob | null = null;
      
      if (attachment.id) {
        const { getAttachmentBlob } = await import('@/utils/idb');
        blob = await getAttachmentBlob(attachment.id);
      } else if (attachment.data) {
        const response = await fetch(attachment.data);
        blob = await response.blob();
      }
      
      if (!blob) {
        toast.error(language === 'ar' ? 'فشل تحميل المرفق' : 'Failed to load attachment');
        return;
      }

      // Convert blob to base64
      const base64Data = await blobToBase64(blob);
      
      // Write file to cache directory first
      const fileName = attachment.name || `file_${Date.now()}`;
      
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        const fileUri = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Cache,
        });

        await Share.share({
          title: attachment.name,
          text: language === 'ar' ? `مشاركة: ${attachment.name}` : `Share: ${attachment.name}`,
          url: fileUri.uri,
          dialogTitle: language === 'ar' ? 'مشاركة المرفق' : 'Share Attachment',
        });

        toast.success(language === 'ar' ? 'تمت المشاركة' : 'Shared successfully');
      } catch (shareError) {
        console.error('Share error:', shareError);
        // Fallback: try web share API
        if (navigator.share) {
          const file = new File([blob], attachment.name, { type: blob.type });
          await navigator.share({
            files: [file],
            title: attachment.name,
          });
          toast.success(language === 'ar' ? 'تمت المشاركة' : 'Shared successfully');
        } else {
          toast.error(language === 'ar' ? 'فشلت المشاركة' : 'Failed to share');
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error(language === 'ar' ? 'فشلت المشاركة' : 'Failed to share');
    }
  };

  const openAttachment = async (attachment: Attachment) => {
    try {
      let blob: Blob | null = null;
      
      if (attachment.id) {
        const { getAttachmentBlob } = await import('@/utils/idb');
        blob = await getAttachmentBlob(attachment.id);
      } else if (attachment.data) {
        const response = await fetch(attachment.data);
        blob = await response.blob();
      }
      
      if (!blob) {
        toast.error(language === 'ar' ? 'فشل تحميل المرفق' : 'Failed to load attachment');
        return;
      }

      const base64Data = await blobToBase64(blob);
      const fileName = attachment.name || `file_${Date.now()}`;

      try {
        // Write to cache directory
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        const fileUri = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Cache,
        });

        // Use Share API to open with external app (this triggers "Open with" dialog)
        await Share.share({
          url: fileUri.uri,
          dialogTitle: language === 'ar' ? 'فتح بواسطة' : 'Open with',
        });
      } catch (fsError) {
        console.error('Filesystem error:', fsError);
        // Fallback: open in new tab (web)
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch (error) {
      console.error('Open error:', error);
      toast.error(language === 'ar' ? 'فشل فتح المرفق' : 'Failed to open attachment');
    }
  };

  const formatTime12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-w-[95vw] animate-slide-up max-h-[90vh] overflow-y-auto">
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
                <p className="font-semibold">{formatTime12Hour(lecture.startTime)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('endTime')}</p>
                <p className="font-semibold">{formatTime12Hour(lecture.endTime)}</p>
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
                      className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                    >
                      <span className="truncate flex-1">{attachment.name}</span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openAttachment(attachment)}
                          title={language === 'ar' ? 'فتح' : 'Open'}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => shareAttachment(attachment)}
                          title={language === 'ar' ? 'مشاركة' : 'Share'}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
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