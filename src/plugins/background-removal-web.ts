import { WebPlugin } from '@capacitor/core';
import type { BackgroundRemovalPlugin } from './background-removal';

export class BackgroundRemovalWeb extends WebPlugin implements BackgroundRemovalPlugin {
  async removeBackground(options: { image: string }): Promise<{ image: string; success: boolean }> {
    // This is a placeholder for web - we use our WebGPU/WASM implementation instead
    console.log('BackgroundRemoval web plugin called, but using custom implementation');
    return {
      image: options.image,
      success: false
    };
  }
}

