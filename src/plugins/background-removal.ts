import { registerPlugin } from '@capacitor/core';

export interface BackgroundRemovalPlugin {
  removeBackground(options: { image: string }): Promise<{ image: string; success: boolean }>;
}

const BackgroundRemoval = registerPlugin<BackgroundRemovalPlugin>('BackgroundRemoval', {
  web: () => import('./background-removal-web').then(m => new m.BackgroundRemovalWeb()),
});

export default BackgroundRemoval;

