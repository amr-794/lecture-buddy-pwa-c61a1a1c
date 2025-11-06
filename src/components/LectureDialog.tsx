import React, { useState, useEffect } from 'react';
import { Lecture, LectureType, Attachment } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HexColorPicker } from 'react-colorful';
import { Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';

interface LectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lecture: Lecture | null;
  onSave: (lecture: Lecture) => void;
  existingLectures: Lecture[];
}

const LectureDialog: React.FC<LectureDialogProps> = ({
  open,
  onOpenChange,
  lecture,
  onSave,
  existingLectures,
}) => {
  const { t, language } = useLanguage();

  const [formData, setFormData] = useState<Partial<Lecture>>({
    name: '',
    type: 'lecture',
    day: 0,
    startTime: '09:00',
    endTime: '10:00',
    color: '#3b82f6',
    attachments: [],
  });

  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (lecture) {
      setFormData(lecture);
    } else {
      setFormData({
        name: '',
        type: 'lecture',
        day: 0,
        startTime: '09:00',
        endTime: '10:00',
        color: '#3b82f6',
        attachments: [],
      });
    }
  }, [lecture, open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

    const arr = Array.from(files);
    for (const file of arr) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          language === 'ar'
            ? `الملف ${file.name} كبير جداً. الحد الأقصى 100 ميجا`
            : `File ${file.name} is too large. Maximum 100MB`
        );
        continue;
      }
      try {
        const { addAttachment } = await import('@/utils/idb');
        const meta = await addAttachment(file);
        const newAttachment: Attachment = {
          id: meta.id,
          name: meta.name,
          type: meta.type,
          size: meta.size,
        };
        setFormData(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment],
        }));
      } catch (err) {
        toast.error(language === 'ar' ? 'فشل رفع الملف' : 'Failed to upload file');
      }
    }
  };

  const removeAttachment = async (index: number) => {
    const target = formData.attachments?.[index];
    if (target?.id) {
      try {
        const { deleteAttachment } = await import('@/utils/idb');
        await deleteAttachment(target.id);
      } catch {}
    }
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || [],
    }));
  };

  const checkTimeConflict = (day: number, startTime: string, endTime: string): boolean => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const newStart = startHour * 60 + startMinute;
    const newEnd = endHour * 60 + endMinute;

    return existingLectures.some(existingLecture => {
      // Skip if it's the same lecture being edited
      if (lecture && existingLecture.id === lecture.id) return false;
      
      // Check if same day
      if (existingLecture.day !== day) return false;

      const [exStartHour, exStartMinute] = existingLecture.startTime.split(':').map(Number);
      const [exEndHour, exEndMinute] = existingLecture.endTime.split(':').map(Number);
      const exStart = exStartHour * 60 + exStartMinute;
      const exEnd = exEndHour * 60 + exEndMinute;

      // Check for overlap
      return (newStart < exEnd && newEnd > exStart);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate time range (7 AM to 8 PM)
    const [startHour] = (formData.startTime || '09:00').split(':').map(Number);
    const [endHour] = (formData.endTime || '10:00').split(':').map(Number);
    
    if (startHour < 7 || endHour > 20 || startHour >= endHour) {
      toast.error(
        language === 'ar'
          ? 'الوقت يجب أن يكون بين 7 صباحاً و 8 مساءً'
          : 'Time must be between 7 AM and 8 PM'
      );
      return;
    }

    // Check for time conflict
    if (checkTimeConflict(formData.day || 0, formData.startTime || '09:00', formData.endTime || '10:00')) {
      toast.error(
        language === 'ar'
          ? 'يوجد تعارض مع محاضرة أخرى في نفس الوقت'
          : 'There is a conflict with another lecture at the same time'
      );
      return;
    }

    const lectureData: Lecture = {
      id: lecture?.id || Date.now().toString(),
      name: formData.name || '',
      type: formData.type || 'lecture',
      day: formData.day || 0,
      startTime: formData.startTime || '09:00',
      endTime: formData.endTime || '10:00',
      color: formData.color || (formData.type === 'section' ? '#22c55e' : '#3b82f6'),
      attachments: formData.attachments || [],
    };
    onSave(lectureData);
  };

  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] animate-slide-up max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lecture ? t('edit') : t('addLecture')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('lectureName')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{t('lectureType')}</Label>
            <Select
              value={formData.type}
              onValueChange={(value: LectureType) => {
                const defaultColor = value === 'section' ? '#22c55e' : '#3b82f6';
                setFormData({ ...formData, type: value, color: defaultColor });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lecture">{t('lecture')}</SelectItem>
                <SelectItem value="section">{t('section')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="day">{t('day')}</Label>
            <Select
              value={formData.day?.toString()}
              onValueChange={value => setFormData({ ...formData, day: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {days.map((day, index) => (
                  <SelectItem key={day} value={index.toString()}>
                    {t(day)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">{t('startTime')}</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">{t('endTime')}</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('color')}</Label>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer transition-transform hover:scale-110"
                style={{ backgroundColor: formData.color }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
            </div>
            {showColorPicker && (
              <div className="mt-2">
                <HexColorPicker
                  color={formData.color}
                  onChange={color => setFormData({ ...formData, color })}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('attachments')}</Label>
            <div className="space-y-2">
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Paperclip className="w-4 h-4 mr-2" />
                {t('addAttachment')}
              </Button>
              
              {formData.attachments && formData.attachments.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {formData.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                    >
                      <span className="truncate flex-1">{attachment.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LectureDialog;
