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
import { ArrowLeft, Facebook, Instagram, Globe, Download, Upload, Camera, Trash2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadLectures, saveLectures, loadProfileImage, saveProfileImage, deleteProfileImage } from '@/utils/storage';
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

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = React.useState(false);
  const [showImportAlert, setShowImportAlert] = React.useState(false);
  const [importedData, setImportedData] = React.useState<any>(null);
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = React.useState<string>('default');

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

    // Listen for profile image updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profileImage') {
        setProfileImage(e.newValue);
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === 'profileImageUpdated') {
        const updatedImage = loadProfileImage();
        setProfileImage(updatedImage);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileImageUpdate', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileImageUpdate', handleCustomEvent);
    };
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

  const handleExport = () => {
    const lectures = loadLectures();
    const dataStr = JSON.stringify(lectures, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-sections-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('language') === 'ar' ? 'تم تصدير البيانات' : 'Data exported');
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            setImportedData(data);
            setShowImportAlert(true);
          } catch (error) {
            toast.error(t('language') === 'ar' ? 'ملف غير صالح' : 'Invalid file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleConfirmImport = () => {
    if (importedData) {
      saveLectures(importedData);
      setShowImportAlert(false);
      toast.success(t('language') === 'ar' ? 'تم استيراد البيانات' : 'Data imported');
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setProfileImage(imageData);
        saveProfileImage(imageData);
        
        // Dispatch custom event for PWA
        window.dispatchEvent(new CustomEvent('profileImageUpdate', { 
          detail: { type: 'profileImageUpdated', image: imageData } 
        }));
        
        toast.success(t('language') === 'ar' ? 'تم تحديث الصورة الشخصية' : 'Profile image updated');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProfileImage = () => {
    setProfileImage(null);
    deleteProfileImage();
    
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
              <CardTitle className="text-base sm:text-lg">
                {t('language') === 'ar' ? 'إدارة البيانات' : 'Data Management'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleExport}
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

          <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.4s' }}>
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
    </div>
  );
};

export default Settings;
