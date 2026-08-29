import { Capacitor } from '@capacitor/core';

export const requestInAppReview = async (): Promise<void> => {
  try {
    // Only trigger on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('🌐 Web platform - skipping in-app review request');
      return;
    }

    console.log('⭐ Requesting in-app review...');
    
    // Dynamic import to avoid issues on web
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
    
    console.log('✅ In-app review request completed');
  } catch (error) {
    console.log('❌ In-app review request failed:', error);
    // Fail silently - reviews are optional
  }
}; 