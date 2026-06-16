import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ro.bacsmart.app',
  appName: 'BACsmart',
  webDir: 'out',
  server: {
    url: 'https://v0-bacsmart-app-design.vercel.app',
    cleartext: true,
  },
};

export default config;
