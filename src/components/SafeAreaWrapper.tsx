/**
 * SafeAreaWrapper - Ensures proper safe area handling across ALL iOS versions
 * 
 * This component automatically handles:
 * - iPhone X+ (notch)
 * - iPhone 14 Pro+ (Dynamic Island)
 * - iPhone 8 and older (standard status bar)
 * - Landscape orientation
 * - iOS 11+ (safe-area-inset support)
 * - Fallbacks for older iOS versions
 */

import React from 'react';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  all?: boolean;
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  className = '',
  top = false,
  bottom = false,
  left = false,
  right = false,
  all = false,
}) => {
  // Build safe area classes
  const safeAreaClasses = [];
  
  if (all) {
    safeAreaClasses.push('safe-area-insets');
  } else {
    if (top) safeAreaClasses.push('safe-area-inset-top');
    if (bottom) safeAreaClasses.push('safe-area-inset-bottom');
    if (left) safeAreaClasses.push('safe-area-inset-left');
    if (right) safeAreaClasses.push('safe-area-inset-right');
  }
  
  return (
    <div className={`${safeAreaClasses.join(' ')} ${className}`}>
      {children}
    </div>
  );
};

/**
 * FullScreenSafeArea - Full screen container with safe areas
 */
export const FullScreenSafeArea: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`screen-safe ${className}`}>
      {children}
    </div>
  );
};

/**
 * Hook to get safe area insets programmatically
 */
export const useSafeAreaInsets = () => {
  const [insets, setInsets] = React.useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  React.useEffect(() => {
    // Get computed safe area insets from CSS
    const getSafeAreaInsets = () => {
      const testEl = document.createElement('div');
      testEl.style.position = 'fixed';
      testEl.style.visibility = 'hidden';
      testEl.style.paddingTop = 'env(safe-area-inset-top)';
      testEl.style.paddingBottom = 'env(safe-area-inset-bottom)';
      testEl.style.paddingLeft = 'env(safe-area-inset-left)';
      testEl.style.paddingRight = 'env(safe-area-inset-right)';
      document.body.appendChild(testEl);
      
      const computed = window.getComputedStyle(testEl);
      const top = parseInt(computed.paddingTop) || 0;
      const bottom = parseInt(computed.paddingBottom) || 0;
      const left = parseInt(computed.paddingLeft) || 0;
      const right = parseInt(computed.paddingRight) || 0;
      
      document.body.removeChild(testEl);
      
      return { top, bottom, left, right };
    };

    setInsets(getSafeAreaInsets());
    
    // Recalculate on orientation change
    const handleResize = () => {
      setInsets(getSafeAreaInsets());
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return insets;
};

