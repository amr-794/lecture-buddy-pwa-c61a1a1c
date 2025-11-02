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
import { ArrowLeft, Facebook, Instagram, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle('dark', checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">{t('settings')}</h1>
        </div>

        <div className="space-y-4">
          <Card className="shadow-lg animate-slide-up">
            <CardHeader>
              <CardTitle>{t('language')}</CardTitle>
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

          <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle>{t('themeSettings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">{t('darkMode')}</Label>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle>{t('notificationSettings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="alarm-sound">{t('alarmSound')}</Label>
                <Select defaultValue="default">
                  <SelectTrigger id="alarm-sound">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="bell">Bell</SelectItem>
                    <SelectItem value="chime">Chime</SelectItem>
                    <SelectItem value="alarm">Alarm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="pt-6">
              <div className="flex justify-center gap-6 mb-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => window.open('https://facebook.com', '_blank')}
                >
                  <Facebook className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => window.open('https://instagram.com', '_blank')}
                >
                  <Instagram className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => window.open('https://example.com', '_blank')}
                >
                  <Globe className="w-5 h-5" />
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  {t('madeBy')}{' '}
                  <span className="font-semibold text-foreground">{t('amrAbdelHadi')}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
