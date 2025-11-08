import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Vibrate, Volume2, CheckCircle2 } from 'lucide-react';
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <Label className="text-sm font-semibold">
                {language === 'ar' ? 'أذونات الإشعارات' : 'Notification Permissions'}
              </Label>
            </div>
            {hasNotificationPermission && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
          </div>
          
          {!hasNotificationPermission && (
            <Button
              onClick={handleRequestPermissions}
              variant="outline"
              className="w-full"
              size="sm"
            >
              {language === 'ar' ? 'طلب الأذونات' : 'Request Permissions'}
            </Button>
          )}
          
          <p className="text-xs text-muted-foreground">
            {language === 'ar'
              ? 'يحتاج التطبيق إلى أذونات لعرض الإشعارات والمنبهات'
              : 'The app needs permissions to show notifications and alarms'}
          </p>
        </div>


        {/* Alarm Sound */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            {language === 'ar' ? 'نغمة المنبه' : 'Alarm Sound'}
          </Label>
          <Select
            value={settings.alarmSound || 'default'}
            onValueChange={(value) => onSettingsChange({ ...settings, alarmSound: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">
                {language === 'ar' ? 'النغمة الافتراضية' : 'Default Sound'}
              </SelectItem>
              <SelectItem value="custom">
                {language === 'ar' ? 'نغمة مخصصة' : 'Custom Sound'}
              </SelectItem>
            </SelectContent>
          </Select>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
