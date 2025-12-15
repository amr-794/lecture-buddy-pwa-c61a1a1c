import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Facebook, Instagram, Globe, Download, Upload, Camera, Trash2, User, Save, Share2, Edit, X, FileDown, FileUp, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadLectures, saveLectures, loadProfileImage, saveProfileImage, deleteProfileImage, loadBackups, saveBackups } from '@/utils/storage';
import { Backup, Lecture } from '@/types';
import { toast } from 'sonner';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { LectureNotificationSettings, loadNotificationSettings, saveNotificationSettings, testNotification, playCustomAlarmTone, vibratePattern } from '@/hooks/use-lecture-notifications';

interface ConflictInfo {
  imported: Lecture;
  existing: Lecture;
}

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = React.useState(false);
  const [showImportAlert, setShowImportAlert] = React.useState(false);
  const [importedData, setImportedData] = React.useState<any>(null);
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = React.useState<string>('default');
  const [backups, setBackups] = React.useState<Backup[]>([]);
  
  // Export dialogs
  const [showExportTypeDialog, setShowExportTypeDialog] = React.useState(false);
  const [showExportOptionsDialog, setShowExportOptionsDialog] = React.useState(false);
  const [showSelectLectureDialog, setShowSelectLectureDialog] = React.useState(false);
  const [selectedLectureForExport, setSelectedLectureForExport] = React.useState<string | null>(null);
  
  // Import dialogs
  const [showImportTypeDialog, setShowImportTypeDialog] = React.useState(false);
  
  // Backup dialogs
  const [showBackupDialog, setShowBackupDialog] = React.useState(false);
  const [showApplyBackupAlert, setShowApplyBackupAlert] = React.useState(false);
  const [selectedBackup, setSelectedBackup] = React.useState<Backup | null>(null);
  const [editingBackupId, setEditingBackupId] = React.useState<string | null>(null);
  const [editingBackupName, setEditingBackupName] = React.useState('');
  
  // Backup options dialog
  const [showBackupOptionsDialog, setShowBackupOptionsDialog] = React.useState(false);
  
  // Conflict handling
  const [showConflictsDialog, setShowConflictsDialog] = React.useState(false);
  const [conflicts, setConflicts] = React.useState<ConflictInfo[]>([]);
  const [nonConflictingLectures, setNonConflictingLectures] = React.useState<Lecture[]>([]);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = React.useState<LectureNotificationSettings>({
    enabled: true,
    minutesBefore: 10,
  });

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
    
    const savedProfileImage = loadProfileImage();
    setProfileImage(savedProfileImage);

    const savedTheme = localStorage.getItem('appTheme') || 'default';
    setCurrentTheme(savedTheme);
    if (savedTheme !== 'default') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    const savedBackups = loadBackups();
    setBackups(savedBackups);

    const currentNotif = loadNotificationSettings();
    setNotificationSettings(currentNotif);

    // Load profile image from IDB (with legacy migration)
    (async () => {
      const { migrateLegacyProfileBase64IfAny, getProfileImageURL } = await import('@/utils/idb');
      await migrateLegacyProfileBase64IfAny();
      const url = await getProfileImageURL();
      setProfileImage(url);
    })();
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', checked ? 'dark' : 'light');
  };

  const handleNotificationToggle = (enabled: boolean) => {
    const updated = { ...notificationSettings, enabled };
    setNotificationSettings(updated);
    saveNotificationSettings(updated);
  };

  // ===== EXPORT FUNCTIONS =====
  const handleExportClick = () => {
    setShowExportTypeDialog(true);
  };

  const handleExportFullSchedule = () => {
    setShowExportTypeDialog(false);
    setShowExportOptionsDialog(true);
  };

  const handleExportSingleLecture = () => {
    const lectures = loadLectures();
    if (lectures.length === 0) {
      toast.error(t('noLecturesToExport'));
      return;
    }
    setShowExportTypeDialog(false);
    setShowSelectLectureDialog(true);
  };

  const handleExportWithChoice = async (includeAttachments: boolean) => {
    toast.info(language === 'ar' ? 'جاري التصدير...' : 'Exporting...');
    
    // Use setTimeout to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const lectures = loadLectures();
    const blobParts: BlobPart[] = ['['];

    if (!includeAttachments) {
      // Fast export without attachments
      lectures.forEach((lec: any, index: number) => {
        const lecWithoutAttachments = { ...lec, attachments: [] };
        blobParts.push(JSON.stringify(lecWithoutAttachments));
        if (index < lectures.length - 1) blobParts.push(',');
      });
    } else {
      // Export with attachments - process one by one to avoid memory spikes
      const { getAttachmentAsDataURL } = await import('@/utils/idb');
      
      for (let i = 0; i < lectures.length; i++) {
        const lec = { ...lectures[i] };
        
        if (lec.attachments && lec.attachments.length) {
          const transformedAtts: any[] = [];
          for (const att of lec.attachments) {
            if (att.id) {
              try {
                const dataUrl = await getAttachmentAsDataURL(att.id);
                if (dataUrl) {
                  transformedAtts.push({ ...att, data: dataUrl });
                }
              } catch {
                // Skip failed attachments
              }
            } else if (att.data) {
              transformedAtts.push(att);
            }
          }
          lec.attachments = transformedAtts;
        }
        
        blobParts.push(JSON.stringify(lec));
        if (i < lectures.length - 1) blobParts.push(',');
        
        // Allow UI to breathe every few lectures
        if (i % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    }

    blobParts.push(']');

    const blob = new Blob(blobParts, { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-sections-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportOptionsDialog(false);
    toast.success(language === 'ar' ? 'تم تصدير البيانات' : 'Data exported');
  };

  const handleExportSelectedLecture = async () => {
    if (!selectedLectureForExport) return;
    
    const lectures = loadLectures();
    const lecture = lectures.find((l: Lecture) => l.id === selectedLectureForExport);
    if (!lecture) return;

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
    setShowSelectLectureDialog(false);
    setSelectedLectureForExport(null);
    toast.success(language === 'ar' ? 'تم تصدير المحاضرة' : 'Lecture exported');
  };

  // ===== IMPORT FUNCTIONS =====
  const handleImportClick = () => {
    setShowImportTypeDialog(true);
  };

  const handleImportFullSchedule = () => {
    setShowImportTypeDialog(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const MAX_IMPORT_SIZE = 7 * 1024 * 1024 * 1024;
        if (file.size > MAX_IMPORT_SIZE) {
          toast.error(language === 'ar' ? 'الملف كبير جداً. الحد الأقصى 7 جيجا' : 'File too large. Max 7GB');
          return;
        }
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          setImportedData(data);
          setShowImportAlert(true);
        } catch (error) {
          toast.error(language === 'ar' ? 'ملف غير صالح' : 'Invalid file');
        }
      }
    };
    input.click();
  };

  const handleImportSingleLectures = () => {
    setShowImportTypeDialog(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = true;
    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files) as File[];
      if (files.length === 0) return;
      
      const MAX_IMPORT_SIZE = 7 * 1024 * 1024 * 1024;
      
      try {
        const allLectures: Lecture[] = [];
        
        // Parse all files in parallel
        await Promise.all(files.map(async (file) => {
          if (file.size > MAX_IMPORT_SIZE) {
            throw new Error('File too large');
          }
          const text = await file.text();
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            allLectures.push(...data);
          } else {
            allLectures.push(data);
          }
        }));

        const existingLectures = loadLectures();
        const conflictsList: ConflictInfo[] = [];
        const nonConflicting: Lecture[] = [];

        // Check conflicts for each imported lecture
        for (const imported of allLectures) {
          const conflict = existingLectures.find((existing: Lecture) => 
            existing.day === imported.day && 
            ((imported.startTime >= existing.startTime && imported.startTime < existing.endTime) ||
             (imported.endTime > existing.startTime && imported.endTime <= existing.endTime) ||
             (imported.startTime <= existing.startTime && imported.endTime >= existing.endTime))
          );
          
          if (conflict) {
            conflictsList.push({ imported, existing: conflict });
          } else {
            nonConflicting.push(imported);
          }
        }

        if (conflictsList.length > 0) {
          setConflicts(conflictsList);
          setNonConflictingLectures(nonConflicting);
          setShowConflictsDialog(true);
        } else {
          // No conflicts, import all directly
          await importLectures(allLectures, []);
        }
      } catch (error) {
        toast.error(language === 'ar' ? 'ملف غير صالح' : 'Invalid file');
      }
    };
    input.click();
  };

  const importLectures = async (lectures: Lecture[], replaceIds: string[]) => {
    const { addAttachment } = await import('@/utils/idb');
    const existingLectures = loadLectures();
    
    // Remove lectures that will be replaced
    let updatedLectures = existingLectures.filter((l: Lecture) => !replaceIds.includes(l.id));
    
    // Process and add new lectures in parallel
    const processedLectures = await Promise.all(lectures.map(async (lecture) => {
      let processedLecture = { ...lecture, id: crypto.randomUUID() };
      
      if (processedLecture.attachments && processedLecture.attachments.length) {
        const restoredAtts = await Promise.all(processedLecture.attachments.map(async (att: any) => {
          if (att.data && att.data.startsWith('data:')) {
            try {
              const res = await fetch(att.data);
              const blob = await res.blob();
              const file = new File([blob], att.name || 'file', { type: att.type || blob.type });
              const saved = await addAttachment(file);
              return { id: saved.id, name: saved.name, type: saved.type, size: saved.size };
            } catch { return null; }
          }
          return att.id ? att : null;
        }));
        processedLecture.attachments = restoredAtts.filter(Boolean);
      }
      
      return processedLecture;
    }));
    
    updatedLectures = [...updatedLectures, ...processedLectures];
    saveLectures(updatedLectures);
    toast.success(t('lecturesImported'));
    setTimeout(() => window.location.reload(), 300);
  };

  const handleReplaceAllConflicts = async () => {
    const allLectures = [...nonConflictingLectures, ...conflicts.map(c => c.imported)];
    const replaceIds = conflicts.map(c => c.existing.id);
    await importLectures(allLectures, replaceIds);
    setShowConflictsDialog(false);
    setConflicts([]);
    setNonConflictingLectures([]);
  };

  const handleSkipConflicts = async () => {
    await importLectures(nonConflictingLectures, []);
    setShowConflictsDialog(false);
    setConflicts([]);
    setNonConflictingLectures([]);
  };

  const handleConfirmImport = async () => {
    if (importedData) {
      const { addAttachment } = await import('@/utils/idb');
      const processedData = await Promise.all(importedData.map(async (lec: any) => {
        if (lec.attachments && lec.attachments.length) {
          const restoredAtts = await Promise.all(lec.attachments.map(async (att: any) => {
            if (att.data && att.data.startsWith('data:')) {
              try {
                const res = await fetch(att.data);
                const blob = await res.blob();
                const file = new File([blob], att.name || 'file', { type: att.type || blob.type });
                const saved = await addAttachment(file);
                return { id: saved.id, name: saved.name, type: saved.type, size: saved.size };
              } catch { return null; }
            }
            return att.id ? att : null;
          }));
          return { ...lec, attachments: restoredAtts.filter(Boolean) };
        }
        return { ...lec, attachments: [] };
      }));
      
      saveLectures(processedData);
      setShowImportAlert(false);
      toast.success(language === 'ar' ? 'تم استيراد البيانات' : 'Data imported');
      setTimeout(() => window.location.reload(), 300);
    }
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const MAX_IMAGE_SIZE = 100 * 1024 * 1024;
      
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(
          language === 'ar'
            ? 'الصورة كبيرة جداً. الحد الأقصى 100 ميجا'
            : 'Image is too large. Maximum 100MB'
        );
        return;
      }

      try {
        const { setProfileImageFile } = await import('@/utils/idb');
        const url = await setProfileImageFile(file);
        setProfileImage(url);
        window.dispatchEvent(new CustomEvent('profileImageUpdate', { 
          detail: { type: 'profileImageUpdated', image: url } 
        }));
        toast.success(t('language') === 'ar' ? 'تم تحديث الصورة الشخصية' : 'Profile image updated');
      } catch (e) {
        toast.error(language === 'ar' ? 'فشل حفظ الصورة' : 'Failed to save image');
      }
    }
  };

  const handleDeleteProfileImage = async () => {
    setProfileImage(null);
    try {
      const { deleteProfileImageIDB } = await import('@/utils/idb');
      await deleteProfileImageIDB();
    } catch {
      deleteProfileImage();
    }
    
    window.dispatchEvent(new CustomEvent('profileImageUpdate', { 
      detail: { type: 'profileImageUpdated', image: null } 
    }));
    
    toast.success(t('language') === 'ar' ? 'تم حذف الصورة الشخصية' : 'Profile image deleted');
  };

  const themes = [
    { value: 'default', label: language === 'ar' ? 'الافتراضي - أزرق' : 'Default - Blue' },
    { value: 'ocean', label: language === 'ar' ? 'المحيط - فيروزي' : 'Ocean - Teal' },
    { value: 'sunset', label: language === 'ar' ? 'الغروب - برتقالي' : 'Sunset - Orange' },
    { value: 'forest', label: language === 'ar' ? 'الغابة - أخضر' : 'Forest - Green' },
    { value: 'purple', label: language === 'ar' ? 'البنفسجي' : 'Purple' },
    { value: 'rose', label: language === 'ar' ? 'الوردي' : 'Rose' },
    { value: 'amber', label: language === 'ar' ? 'العنبر - ذهبي' : 'Amber - Gold' },
  ];

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('appTheme', theme);
    
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  };

  const handleCreateBackupClick = () => {
    if (backups.length >= 3) {
      toast.error(t('maxBackupsReached'));
      return;
    }
    setShowBackupOptionsDialog(true);
  };

  const createBackup = async (includeAttachments: boolean) => {
    setShowBackupOptionsDialog(false);
    
    const lectures = loadLectures();
    let backupLectures = lectures.map((l: Lecture) => ({ ...l }));

    if (includeAttachments) {
      toast.info(language === 'ar' ? 'جاري إنشاء النسخة مع المرفقات...' : 'Creating backup with attachments...');
      const { getAttachmentAsDataURL } = await import('@/utils/idb');
      await Promise.all(backupLectures.map(async (lec: any) => {
        if (lec.attachments && lec.attachments.length) {
          const transformed = await Promise.all(lec.attachments.map(async (att: any) => {
            if (att.id) {
              const dataUrl = await getAttachmentAsDataURL(att.id);
              return dataUrl ? { ...att, data: dataUrl } : null;
            }
            return att.data ? att : null;
          }));
          lec.attachments = transformed.filter(Boolean);
        }
      }));
    } else {
      backupLectures = backupLectures.map((l: any) => ({ ...l, attachments: [] }));
    }

    const newBackup: Backup = {
      id: Date.now().toString(),
      name: `${language === 'ar' ? 'نسخة احتياطية' : 'Backup'} ${backups.length + 1}`,
      date: new Date().toISOString(),
      lectures: backupLectures,
    };

    const updatedBackups = [...backups, newBackup];
    setBackups(updatedBackups);
    saveBackups(updatedBackups);
    toast.success(language === 'ar' ? 'تم إنشاء النسخة الاحتياطية' : 'Backup created');
  };

  const applyBackup = (backup: Backup) => {
    setSelectedBackup(backup);
    setShowApplyBackupAlert(true);
  };

  const confirmApplyBackup = () => {
    if (selectedBackup) {
      saveLectures(selectedBackup.lectures);
      setShowApplyBackupAlert(false);
      toast.success(t('language') === 'ar' ? 'تم تطبيق النسخة الاحتياطية' : 'Backup applied');
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const shareBackup = (backup: Backup) => {
    const dataStr = JSON.stringify(backup.lectures, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${backup.name}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('language') === 'ar' ? 'تم تصدير النسخة' : 'Backup exported');
  };

  const [deleteStep, setDeleteStep] = React.useState<0 | 1 | 2>(0);
  const [backupToDelete, setBackupToDelete] = React.useState<Backup | null>(null);

  const deleteBackup = (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) return;
    setBackupToDelete(backup);
    setDeleteStep(1);
  };

  const completeDeleteBackup = () => {
    if (!backupToDelete) return;
    const updatedBackups = backups.filter(b => b.id !== backupToDelete.id);
    setBackups(updatedBackups);
    saveBackups(updatedBackups);
    setDeleteStep(0);
    setBackupToDelete(null);
    toast.success(t('language') === 'ar' ? 'تم حذف النسخة' : 'Backup deleted');
  };

  const startRenameBackup = (backup: Backup) => {
    setEditingBackupId(backup.id);
    setEditingBackupName(backup.name);
  };

  const saveBackupName = (backupId: string) => {
    const updatedBackups = backups.map(b =>
      b.id === backupId ? { ...b, name: editingBackupName } : b
    );
    setBackups(updatedBackups);
    saveBackups(updatedBackups);
    setEditingBackupId(null);
    toast.success(t('language') === 'ar' ? 'تم تحديث الاسم' : 'Name updated');
  };

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const allLectures = loadLectures();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-3 sm:p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full h-9 w-9 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('settings')}</h1>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Card className="shadow-lg animate-slide-up">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                {t('language') === 'ar' ? 'الصورة الشخصية' : 'Profile Image'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-32 h-32 sm:w-40 sm:h-40">
                  <AvatarImage src={profileImage || undefined} alt="Profile" />
                  <AvatarFallback className="bg-primary/10">
                    <User className="w-16 h-16 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex gap-2 w-full justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 max-w-xs"
                    onClick={() => document.getElementById('profile-upload')?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {t('language') === 'ar' ? 'تحميل صورة' : 'Upload Image'}
                  </Button>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageUpload}
                  />
                  {profileImage && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteProfileImage}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">{t('language')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={language} onValueChange={(val: 'ar' | 'en') => setLanguage(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">{t('arabic')}</SelectItem>
                  <SelectItem value="en">{t('english')}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">{t('themeSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode" className="text-sm sm:text-base">{t('darkMode')}</Label>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">
                  {language === 'ar' ? 'قالب الألوان' : 'Color Theme'}
                </Label>
                <Select value={currentTheme} onValueChange={handleThemeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map(theme => (
                      <SelectItem key={theme.value} value={theme.value}>
                        {theme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">{t('notificationSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="lecture-notifications" className="text-sm sm:text-base">
                  {language === 'ar' ? 'تفعيل التنبيهات' : 'Enable Notifications'}
                </Label>
                <Switch
                  id="lecture-notifications"
                  checked={notificationSettings.enabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {language === 'ar'
                  ? 'يتم إرسال إشعار قبل المحاضرة بـ 10 دقائق و5 دقائق وعند بدء المحاضرة، مع نغمة منبه مخصصة (20 ثانية) واهتزاز متتالي. يعمل حتى عند إغلاق التطبيق.'
                  : 'Notifications are sent 10 min, 5 min before, and at lecture start time with a custom 20-second alarm tone and cascading vibration. Works even when app is closed.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={async () => {
                  const success = await testNotification();
                  if (success) {
                    toast.success(language === 'ar' ? 'تم إرسال إشعار تجريبي' : 'Test notification sent');
                  } else {
                    toast.error(language === 'ar' ? 'يرجى السماح بالإشعارات' : 'Please allow notifications');
                  }
                }}
              >
                <Bell className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'اختبار الإشعار' : 'Test Notification'}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">{t('backups')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleCreateBackupClick}
                variant="outline"
                className="w-full justify-start text-sm sm:text-base"
                disabled={backups.length >= 3}
              >
                <Save className="w-4 h-4 mr-2" />
                {t('createBackup')} ({backups.length}/3)
              </Button>

              {backups.length > 0 && (
                <div className="space-y-2">
                  {backups.map(backup => (
                    <div
                      key={backup.id}
                      className="p-3 bg-muted rounded-lg space-y-2"
                    >
                      {editingBackupId === backup.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editingBackupName}
                            onChange={e => setEditingBackupName(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => saveBackupName(backup.id)}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingBackupId(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">{backup.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(backup.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startRenameBackup(backup)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => applyBackup(backup)}
                            >
                              {t('applyBackup')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => shareBackup(backup)}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteBackup(backup.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                {t('language') === 'ar' ? 'إدارة البيانات' : 'Data Management'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleExportClick}
                variant="outline"
                className="w-full justify-start text-sm sm:text-base"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('exportData')}
              </Button>
              <Button
                onClick={handleImportClick}
                variant="outline"
                className="w-full justify-start text-sm sm:text-base"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('importData')}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <CardContent className="pt-4 sm:pt-6">
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export Type Dialog */}
      <Dialog open={showExportTypeDialog} onOpenChange={setShowExportTypeDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('selectExportType')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              onClick={handleExportFullSchedule}
              variant="outline"
              className="w-full justify-start"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {t('exportFullSchedule')}
            </Button>
            <Button
              onClick={handleExportSingleLecture}
              variant="outline"
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('exportSingleLectureOption')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Options Dialog (with/without attachments) */}
      <Dialog open={showExportOptionsDialog} onOpenChange={setShowExportOptionsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('exportData')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              onClick={() => handleExportWithChoice(true)}
              variant="outline"
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('exportWithAttachments')}
            </Button>
            <Button
              onClick={() => handleExportWithChoice(false)}
              variant="outline"
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('exportWithoutAttachments')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Select Lecture to Export Dialog */}
      <Dialog open={showSelectLectureDialog} onOpenChange={setShowSelectLectureDialog}>
        <DialogContent className="sm:max-w-[450px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t('selectLectureToExport')}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-2 pr-2">
              {allLectures.map((lecture: Lecture) => (
                <div
                  key={lecture.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedLectureForExport === lecture.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:bg-muted'
                  }`}
                  onClick={() => setSelectedLectureForExport(lecture.id)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: lecture.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{lecture.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t(days[lecture.day])} • {lecture.startTime} - {lecture.endTime}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSelectLectureDialog(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleExportSelectedLecture}
              disabled={!selectedLectureForExport}
            >
              {t('exportData')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Type Dialog */}
      <Dialog open={showImportTypeDialog} onOpenChange={setShowImportTypeDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('selectImportType')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              onClick={handleImportFullSchedule}
              variant="outline"
              className="w-full justify-start"
            >
              <FileUp className="w-4 h-4 mr-2" />
              {t('importFullSchedule')}
            </Button>
            <Button
              onClick={handleImportSingleLectures}
              variant="outline"
              className="w-full justify-start flex-col items-start h-auto py-3"
            >
              <div className="flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                {t('importSingleLectureOption')}
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {t('selectFiles')}
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Schedule Import Alert */}
      <AlertDialog open={showImportAlert} onOpenChange={setShowImportAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmImport')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('importWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              {t('language') === 'ar' ? 'استيراد' : 'Import'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Conflicts Dialog */}
      <Dialog open={showConflictsDialog} onOpenChange={setShowConflictsDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-orange-500">{t('multipleConflictsDetected')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('conflictsDetails')}</p>
            <ScrollArea className="max-h-[40vh]">
              <div className="space-y-3 pr-2">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: conflict.imported.color }}
                      />
                      <span className="font-semibold text-sm truncate">{conflict.imported.name}</span>
                    </div>
                    <p className="text-xs text-orange-500">
                      {t('conflictsWith')}:
                    </p>
                    <div className="flex items-center gap-2 pl-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: conflict.existing.color }}
                      />
                      <span className="text-sm truncate">{conflict.existing.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({t(days[conflict.existing.day])} {conflict.existing.startTime})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {nonConflictingLectures.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {language === 'ar' 
                  ? `${nonConflictingLectures.length} محاضرات بدون تعارض سيتم استيرادها`
                  : `${nonConflictingLectures.length} non-conflicting lectures will be imported`
                }
              </p>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowConflictsDialog(false)}>
              {t('cancel')}
            </Button>
            {nonConflictingLectures.length > 0 && (
              <Button variant="secondary" onClick={handleSkipConflicts}>
                {t('skipConflicts')}
              </Button>
            )}
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleReplaceAllConflicts}>
              {t('replaceAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showApplyBackupAlert} onOpenChange={setShowApplyBackupAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmBackupApply')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('backupWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApplyBackup}>
              {t('applyBackup')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backup delete confirmations - step 1 */}
      <AlertDialog open={deleteStep === 1} onOpenChange={(open) => setDeleteStep(open ? 1 : 0)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDeleteBackupFirst').replace('{name}', backupToDelete?.name || '')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('language') === 'ar' ? 'ستنتقل للخطوة التالية للتأكيد النهائي' : 'You will proceed to the final confirmation step'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteStep(0)}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => setDeleteStep(2)}>
              {t('language') === 'ar' ? 'متابعة' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backup delete confirmations - step 2 (destructive) */}
      <AlertDialog open={deleteStep === 2} onOpenChange={(open) => setDeleteStep(open ? 2 : 0)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {t('confirmDeleteBackupSecond')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('language') === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteStep(0)}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={completeDeleteBackup}>
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backup Options Dialog */}
      <Dialog open={showBackupOptionsDialog} onOpenChange={setShowBackupOptionsDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'خيارات النسخة الاحتياطية' : 'Backup Options'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              onClick={() => createBackup(true)}
              variant="outline"
              className="w-full justify-start"
            >
              <Save className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'نسخة مع المرفقات' : 'Backup with attachments'}
            </Button>
            <Button
              onClick={() => createBackup(false)}
              variant="outline"
              className="w-full justify-start"
            >
              <Save className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'نسخة بدون المرفقات (الجدول فقط)' : 'Backup without attachments (schedule only)'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
