import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.93ac7bebab3a46e08d24eb0f4d060912',
  appName: 'منبه المحاضرات',
  webDir: 'dist',
  server: {
    url: 'https://93ac7beb-ab3a-46e0-8d24-eb0f4d060912.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#3b82f6",
      sound: "beep.wav",
    },
  },
};

export default config;
