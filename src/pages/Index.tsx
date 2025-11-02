import React, { useState, useEffect } from 'react';
import { Lecture } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { saveLectures, loadLectures } from '@/utils/storage';
import { requestNotificationPermission, scheduleNotification } from '@/utils/notifications';
import WeeklySchedule from '@/components/WeeklySchedule';
import LectureDialog from '@/components/LectureDialog';
import LectureDetailsDialog from '@/components/LectureDetailsDialog';
import { Button } from '@/components/ui/button';
import { Plus, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);

  useEffect(() => {
    const loadedLectures = loadLectures();
    setLectures(loadedLectures);
    requestNotificationPermission();

    // Load theme
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleSaveLecture = (lecture: Lecture) => {
    let updatedLectures: Lecture[];
    
    if (editingLecture) {
      updatedLectures = lectures.map(l => (l.id === lecture.id ? lecture : l));
      toast.success(t('language') === 'ar' ? 'تم تحديث المحاضرة' : 'Lecture updated');
    } else {
      updatedLectures = [...lectures, lecture];
      toast.success(t('language') === 'ar' ? 'تمت إضافة المحاضرة' : 'Lecture added');
    }

    setLectures(updatedLectures);
    saveLectures(updatedLectures);
    scheduleNotification(lecture);
    setDialogOpen(false);
    setEditingLecture(null);
  };

  const handleLectureClick = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setDetailsDialogOpen(true);
  };

  const handleEdit = () => {
    if (selectedLecture) {
      setEditingLecture(selectedLecture);
      setDetailsDialogOpen(false);
      setDialogOpen(true);
    }
  };

  const handleDelete = () => {
    if (selectedLecture) {
      const updatedLectures = lectures.filter(l => l.id !== selectedLecture.id);
      setLectures(updatedLectures);
      saveLectures(updatedLectures);
      setDetailsDialogOpen(false);
      setSelectedLecture(null);
      toast.success(t('language') === 'ar' ? 'تم حذف المحاضرة' : 'Lecture deleted');
    }
  };

  const handleAddNew = () => {
    setEditingLecture(null);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t('appTitle')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t('schedule')}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAddNew}
              className="rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('addLecture')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/settings')}
              className="rounded-full"
            >
              <SettingsIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-card rounded-2xl shadow-xl p-6 animate-fade-in">
          {lectures.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">
                {t('language') === 'ar' ? 'لا توجد محاضرات بعد' : 'No lectures yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('language') === 'ar'
                  ? 'ابدأ بإضافة محاضراتك للحصول على جدول منظم'
                  : 'Start by adding your lectures to create an organized schedule'}
              </p>
              <Button onClick={handleAddNew} size="lg" className="rounded-full">
                <Plus className="w-5 h-5 mr-2" />
                {t('addLecture')}
              </Button>
            </div>
          ) : (
            <WeeklySchedule lectures={lectures} onLectureClick={handleLectureClick} />
          )}
        </div>
      </div>

      <LectureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lecture={editingLecture}
        onSave={handleSaveLecture}
      />

      <LectureDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        lecture={selectedLecture}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Index;
