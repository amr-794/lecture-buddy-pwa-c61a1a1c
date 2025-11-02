import React, { useState, useEffect } from 'react';
import { Lecture, LectureType } from '@/types';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HexColorPicker } from 'react-colorful';

interface LectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lecture: Lecture | null;
  onSave: (lecture: Lecture) => void;
}

const LectureDialog: React.FC<LectureDialogProps> = ({
  open,
  onOpenChange,
  lecture,
  onSave,
}) => {
  const { t } = useLanguage();

  const [formData, setFormData] = useState<Partial<Lecture>>({
    name: '',
    type: 'lecture',
    day: 0,
    startTime: '09:00',
    endTime: '10:00',
    color: '#3b82f6',
    notificationEnabled: true,
    notificationMinutes: 15,
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
        notificationEnabled: true,
        notificationMinutes: 15,
      });
    }
  }, [lecture, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lectureData: Lecture = {
      id: lecture?.id || Date.now().toString(),
      name: formData.name || '',
      type: formData.type || 'lecture',
      day: formData.day || 0,
      startTime: formData.startTime || '09:00',
      endTime: formData.endTime || '10:00',
      color: formData.color || (formData.type === 'section' ? '#22c55e' : '#3b82f6'),
      notificationEnabled: formData.notificationEnabled ?? true,
      notificationMinutes: formData.notificationMinutes || 15,
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
      <DialogContent className="sm:max-w-[500px] animate-slide-up">
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
              <Input
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                className="flex-1"
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

          <div className="flex items-center justify-between">
            <Label htmlFor="notification">{t('notification')}</Label>
            <Switch
              id="notification"
              checked={formData.notificationEnabled}
              onCheckedChange={checked =>
                setFormData({ ...formData, notificationEnabled: checked })
              }
            />
          </div>

          {formData.notificationEnabled && (
            <div className="space-y-2">
              <Label htmlFor="notifyBefore">{t('notifyBefore')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="notifyBefore"
                  type="number"
                  min="5"
                  max="120"
                  value={formData.notificationMinutes}
                  onChange={e =>
                    setFormData({ ...formData, notificationMinutes: parseInt(e.target.value) })
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">{t('minutes')}</span>
              </div>
            </div>
          )}

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
