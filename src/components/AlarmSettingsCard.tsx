import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Vibrate, Volume2, CheckCircle2, Shield, Music } from 'lucide-react';
import { Settings as SettingsType } from '@/types';
import { NotificationService } from '@/services/notificationService';
import { toast } from 'sonner';

interface AlarmSettingsCardProps {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
  language: 'ar' | 'en';
  hasNotificationPermission: boolean;
  onPermissionChange: (granted: boolean) => void;
}

const AlarmSettingsCard: React.FC<AlarmSettingsCardProps> = ({
  settings,
  onSettingsChange,
  language,
  hasNotificationPermission,
  onPermissionChange,
}) => {
  const handleRequestPermissions = async () => {
    const granted = await NotificationService.requestPermissions();
    onPermissionChange(granted);
    if (granted) {
      toast.success(language === 'ar' ? 'تم منح الأذونات بنجاح' : 'Permissions granted successfully');
    } else {
      toast.error(language === 'ar' ? 'تم رفض الأذونات' : 'Permissions denied');
    }
  };

  const handleTestAlarm = async () => {
    await NotificationService.testNotification(settings);
    toast.success(language === 'ar' ? 'سيظهر الإشعار التجريبي خلال ثوانٍ' : 'Test notification will appear in seconds');
  };

  const handleVibrationTest = async () => {
    await NotificationService.triggerVibration(settings.vibrationPattern || 'medium');
    toast.success(language === 'ar' ? 'اختبار الاهتزاز' : 'Vibration test');
  };

  const handleSelectRingtone = async () => {
    // Create file input for audio files
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        onSettingsChange({ ...settings, alarmSound: file.name });
        toast.success(language === 'ar' ? `تم اختيار: ${file.name}` : `Selected: ${file.name}`);
      }
    };
    input.click();
  };

  return (
    <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.25s' }}>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {language === 'ar' ? 'إعدادات المنبه' : 'Alarm Settings'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permissions Section */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <Label className="text-sm font-semibold">
              {language === 'ar' ? 'الأذونات المطلوبة' : 'Required Permissions'}
            </Label>
          </div>
          
          <div className="space-y-2">
            {/* Notification Permission */}
            <div className="flex items-center justify-between p-2 bg-background rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                </span>
              </div>
              {hasNotificationPermission ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Button size="sm" variant="outline" onClick={handleRequestPermissions}>
                  {language === 'ar' ? 'السماح' : 'Allow'}
                </Button>
              )}
            </div>

            {/* Background Running Info */}
            <div className="flex items-center justify-between p-2 bg-background rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {language === 'ar' ? 'العمل في الخلفية' : 'Background Running'}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {language === 'ar' ? 'تلقائي' : 'Auto'}
              </span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {language === 'ar'
              ? 'يحتاج التطبيق إلى أذونات لعرض الإشعارات والمنبهات حتى عند إغلاق التطبيق'
              : 'The app needs permissions to show notifications and alarms even when the app is closed'}
          </p>
        </div>

        {/* Alarm Sound */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            {language === 'ar' ? 'نغمة المنبه' : 'Alarm Sound'}
          </Label>
          <div className="flex gap-2">
            <Select
              value={settings.alarmSound || 'default'}
              onValueChange={(value) => onSettingsChange({ ...settings, alarmSound: value })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} className="z-50">
                <SelectItem value="default">
                  {language === 'ar' ? 'النغمة الافتراضية' : 'Default Sound'}
                </SelectItem>
                {settings.alarmSound && settings.alarmSound !== 'default' && (
                  <SelectItem value={settings.alarmSound}>
                    {settings.alarmSound}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSelectRingtone}
              title={language === 'ar' ? 'اختيار نغمة' : 'Select Ringtone'}
            >
              <Music className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Vibration Settings */}
        <div className="space-y-3 p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Vibrate className="w-4 h-4" />
              {language === 'ar' ? 'تفعيل الاهتزاز' : 'Enable Vibration'}
            </Label>
            <Switch
              checked={settings.vibrationEnabled ?? true}
              onCheckedChange={(checked) => onSettingsChange({
                ...settings,
                vibrationEnabled: checked,
              })}
            />
          </div>

          {settings.vibrationEnabled && (
            <>
              <div className="space-y-2">
                <Label className="text-xs">
                  {language === 'ar' ? 'نمط الاهتزاز' : 'Vibration Pattern'}
                </Label>
                <Select
                  value={settings.vibrationPattern || 'medium'}
                  onValueChange={(value: any) => onSettingsChange({
                    ...settings,
                    vibrationPattern: value,
                  })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="z-50">
                    <SelectItem value="short">
                      {language === 'ar' ? 'قصير' : 'Short'}
                    </SelectItem>
                    <SelectItem value="medium">
                      {language === 'ar' ? 'متوسط' : 'Medium'}
                    </SelectItem>
                    <SelectItem value="long">
                      {language === 'ar' ? 'طويل' : 'Long'}
                    </SelectItem>
                    <SelectItem value="custom">
                      {language === 'ar' ? 'نمط مخصص (3 مرات)' : 'Custom (3 times)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleVibrationTest}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {language === 'ar' ? 'اختبار الاهتزاز' : 'Test Vibration'}
              </Button>
            </>
          )}
        </div>

        {/* Test Alarm Button */}
        <Button
          onClick={handleTestAlarm}
          variant="default"
          className="w-full"
          disabled={!hasNotificationPermission}
        >
          <Bell className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'اختبار المنبه' : 'Test Alarm'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          {language === 'ar'
            ? 'سيتم تطبيق هذه الإعدادات على جميع المنبهات المستقبلية'
            : 'These settings will apply to all future alarms'}
        </p>
      </CardContent>
    </Card>
  );
};

export default AlarmSettingsCard;