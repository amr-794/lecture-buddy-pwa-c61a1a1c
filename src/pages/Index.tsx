import React, { useState, useEffect } from 'react';
import { Lecture } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { saveLectures, loadLectures, loadProfileImage } from '@/utils/storage';
import WeeklySchedule from '@/components/WeeklySchedule';
import LectureDialog from '@/components/LectureDialog';
import LectureDetailsDialog from '@/components/LectureDetailsDialog';
import { Button } from '@/components/ui/button';
import { Plus, Settings as SettingsIcon, Facebook, Instagram, Globe, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Index = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    const loadedLectures = loadLectures();
    setLectures(loadedLectures);

    // Load theme
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // Load app theme
    const appTheme = localStorage.getItem('appTheme');
    if (appTheme && appTheme !== 'default') {
      document.documentElement.setAttribute('data-theme', appTheme);
    }

    // Load profile image from IDB (with legacy migration fallback)
    (async () => {
      const { migrateLegacyProfileBase64IfAny, getProfileImageURL } = await import('@/utils/idb');
      await migrateLegacyProfileBase64IfAny();
      const url = await getProfileImageURL();
      setProfileImage(url);
    })();

    // Listen for profile image updates (for PWA)
    const refreshProfileImage = async () => {
      const { getProfileImageURL } = await import('@/utils/idb');
      const url = await getProfileImageURL();
      setProfileImage(url);
    };

    const handleProfileImageUpdate = async (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === 'profileImageUpdated') {
        await refreshProfileImage();
      }
    };

    const handleFocus = async () => {
      await refreshProfileImage();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('profileImageUpdate', handleProfileImageUpdate);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('profileImageUpdate', handleProfileImageUpdate);
    };
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

  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false);

  const handleDelete = () => {
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (selectedLecture) {
      const updatedLectures = lectures.filter(l => l.id !== selectedLecture.id);
      setLectures(updatedLectures);
      saveLectures(updatedLectures);
      setDetailsDialogOpen(false);
      setSelectedLecture(null);
      setShowDeleteAlert(false);
      toast.success(t('language') === 'ar' ? 'تم حذف المحاضرة' : 'Lecture deleted');
    }
  };

  const handleAddNew = () => {
    setEditingLecture(null);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 pb-20">
      <div className="container mx-auto p-3 sm:p-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6 animate-slide-up relative">
          {/* Profile Image */}
          <Avatar
            className={`absolute top-0 w-12 h-12 sm:w-14 sm:h-14 cursor-pointer transition-transform hover:scale-110 ${
              language === 'ar' ? 'right-0' : 'left-0'
            }`}
            onClick={() => setProfileDialogOpen(true)}
          >
            <AvatarImage src={profileImage || undefined} alt="Profile" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>

          <div className={language === 'ar' ? 'mr-16 sm:mr-0' : 'ml-16 sm:ml-0'}>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t('appTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t('schedule')}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={handleAddNew}
              className="flex-1 sm:flex-none rounded-full shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
              size="sm"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              {t('addLecture')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/settings')}
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10"
            >
              <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-card rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 animate-fade-in mb-4">
          {lectures.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="text-4xl sm:text-6xl mb-4">📚</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                {t('language') === 'ar' ? 'لا توجد محاضرات بعد' : 'No lectures yet'}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
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

        {/* Footer - Social Links */}
        <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 animate-fade-in">
          <div className="flex justify-center gap-4 sm:gap-6 mb-4">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => window.open('https://www.facebook.com/qr?id=61551830860947', '_blank')}
            >
              <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => window.open('https://www.instagram.com/amr_abdelhady_7_9_4?igsh=amk4ZWFqdjlqdmcz', '_blank')}
            >
              <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => window.open('http://amrabdelhady.free.nf', '_blank')}
            >
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => window.open('https://amr-794.github.io/AmrAbdelhady', '_blank')}
            >
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            <p>
              {t('madeBy')}{' '}
              <span className="font-semibold text-foreground">{t('amrAbdelHadi')}</span>
            </p>
          </div>
        </div>
      </div>

      <LectureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lecture={editingLecture}
        onSave={handleSaveLecture}
        existingLectures={lectures}
      />

      <LectureDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        lecture={selectedLecture}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Profile Image Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-md">
          <div className="flex justify-center items-center p-4">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-64 h-64 sm:w-80 sm:h-80 object-cover rounded-full shadow-2xl"
              />
            ) : (
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-32 h-32 text-muted-foreground" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
