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
import { ArrowLeft, Facebook, Instagram, Globe, Download, Upload, Camera, Trash2, User, Save, Share2, Edit, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadLectures, saveLectures, loadProfileImage, saveProfileImage, deleteProfileImage, loadBackups, saveBackups } from '@/utils/storage';
import { Backup } from '@/types';
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

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = React.useState(false);
  const [showImportAlert, setShowImportAlert] = React.useState(false);
  const [importedData, setImportedData] = React.useState<any>(null);
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = React.useState<string>('default');
  const [backups, setBackups] = React.useState<Backup[]>([]);
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const [showBackupDialog, setShowBackupDialog] = React.useState(false);
  const [showApplyBackupAlert, setShowApplyBackupAlert] = React.useState(false);
  const [selectedBackup, setSelectedBackup] = React.useState<Backup | null>(null);
  const [editingBackupId, setEditingBackupId] = React.useState<string | null>(null);
  const [editingBackupName, setEditingBackupName] = React.useState('');
  const [showConflictAlert, setShowConflictAlert] = React.useState(false);
  const [conflictingLecture, setConflictingLecture] = React.useState<any>(null);
  const [importedSingleLecture, setImportedSingleLecture] = React.useState<any>(null);

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

  const handleExportWithChoice = async (includeAttachments: boolean) => {
    const lectures = loadLectures();
    let dataToExport = lectures.map(l => ({ ...l }));

    if (!includeAttachments) {
      dataToExport = dataToExport.map(l => ({ ...l, attachments: [] }));
    } else {
      // Fetch blobs from IDB and convert to base64 for export - parallel processing
      const { getAttachmentAsDataURL } = await import('@/utils/idb');
      await Promise.all(dataToExport.map(async (lec) => {
        if (lec.attachments && lec.attachments.length) {
          const transformed = await Promise.all(lec.attachments.map(async (att: any) => {
            if (att.id) {
              const dataUrl = await getAttachmentAsDataURL(att.id);
              return dataUrl ? { ...att, data: dataUrl } : null;
            }
            return att.data ? att : null;
          }));
          lec.attachments = transformed.filter(Boolean) as any;
        }
      }));
    }

    // Use streaming JSON for large files (up to 7GB)
    const dataStr = JSON.stringify(dataToExport);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-sections-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportDialog(false);
    toast.success(t('language') === 'ar' ? 'تم تصدير البيانات' : 'Data exported');
  };

  const handleImportClick = () => {
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
          
          // Check if it's a single lecture import
          if (Array.isArray(data) && data.length === 1) {
            const singleLecture = data[0];
            const existingLectures = loadLectures();
            
            // Check for conflicts
            const conflict = existingLectures.find((l: any) => 
              l.day === singleLecture.day && 
              ((singleLecture.startTime >= l.startTime && singleLecture.startTime < l.endTime) ||
               (singleLecture.endTime > l.startTime && singleLecture.endTime <= l.endTime) ||
               (singleLecture.startTime <= l.startTime && singleLecture.endTime >= l.endTime))
            );
            
            if (conflict) {
              setConflictingLecture(conflict);
              setImportedSingleLecture(singleLecture);
              setShowConflictAlert(true);
              return;
            }
            
            // No conflict, import directly
            await importSingleLecture(singleLecture, existingLectures, null);
          } else {
            setImportedData(data);
            setShowImportAlert(true);
          }
        } catch (error) {
          toast.error(language === 'ar' ? 'ملف غير صالح' : 'Invalid file');
        }
      }
    };
    input.click();
  };

  const importSingleLecture = async (lecture: any, existingLectures: any[], replaceId: string | null) => {
    const { addAttachment } = await import('@/utils/idb');
    
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
    
    let updatedLectures;
    if (replaceId) {
      updatedLectures = existingLectures.map((l: any) => l.id === replaceId ? processedLecture : l);
    } else {
      updatedLectures = [...existingLectures, processedLecture];
    }
    
    saveLectures(updatedLectures);
    toast.success(language === 'ar' ? 'تم استيراد المحاضرة' : 'Lecture imported');
    setTimeout(() => window.location.reload(), 300);
  };

  const handleConfirmConflictReplace = async () => {
    if (importedSingleLecture && conflictingLecture) {
      const existingLectures = loadLectures();
      await importSingleLecture(importedSingleLecture, existingLectures, conflictingLecture.id);
      setShowConflictAlert(false);
      setConflictingLecture(null);
      setImportedSingleLecture(null);
    }
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
      const MAX_IMAGE_SIZE = 100 * 1024 * 1024; // 100MB
      
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
        // Dispatch custom event for PWA
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
      // fallback: remove legacy
      deleteProfileImage();
    }
    
    // Dispatch custom event for PWA
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

  const createBackup = () => {
    if (backups.length >= 3) {
      toast.error(t('maxBackupsReached'));
      return;
    }

    const lectures = loadLectures();
    const newBackup: Backup = {
      id: Date.now().toString(),
      name: `${t('language') === 'ar' ? 'نسخة احتياطية' : 'Backup'} ${backups.length + 1}`,
      date: new Date().toISOString(),
      lectures,
    };

    const updatedBackups = [...backups, newBackup];
    setBackups(updatedBackups);
    saveBackups(updatedBackups);
    toast.success(t('language') === 'ar' ? 'تم إنشاء النسخة الاحتياطية' : 'Backup created');
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

          <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">{t('backups')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={createBackup}
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
                onClick={() => setShowExportDialog(true)}
                variant="outline"
                className="w-full justify-start text-sm sm:text-base"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('exportData')}
              </Button>
              <Button
                onClick={handleImportClick}
                variant="outline"
                className="w-full justify-start text-sm sm:text-base"
              >
                <Upload className="w-4 h-4 mr-2" />
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

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
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

      {/* Conflict Alert Dialog */}
      <AlertDialog open={showConflictAlert} onOpenChange={setShowConflictAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-orange-500">{t('conflictDetected')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('conflictMessage')}
              {conflictingLecture && (
                <div className="mt-2 p-2 bg-muted rounded-lg">
                  <p className="font-semibold">{conflictingLecture.name}</p>
                  <p className="text-xs">{conflictingLecture.startTime} - {conflictingLecture.endTime}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowConflictAlert(false);
              setConflictingLecture(null);
              setImportedSingleLecture(null);
            }}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-orange-500 hover:bg-orange-600" onClick={handleConfirmConflictReplace}>
              {t('replace')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
