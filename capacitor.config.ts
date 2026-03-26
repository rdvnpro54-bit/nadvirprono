import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.pronosia',
  appName: 'Pronosia',
  webDir: 'dist',
  server: {
    url: 'https://7cacd61d-996c-4fe2-9ed1-9b83e650006d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
