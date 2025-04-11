
import React, { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Define the Tawk_API type
declare global {
  interface Window {
    Tawk_API: {
      onLoaded?: () => void;
      hideWidget?: () => void;
      showWidget?: () => void;
      toggle?: () => void;
      popup?: () => void;
      maximize?: () => void;
      minimize?: () => void;
      endChat?: () => void;
      isChatHidden?: () => boolean;
      onChatHidden?: () => void;
      onChatMaximized?: () => void;
      onChatMinimized?: () => void;
      setAttributes?: (attributes: Record<string, string>, callback?: () => void) => void;
    };
  }
}

interface TawkToChatProps {
  // Optional props for customization
  tawkId?: string;
  autoHide?: boolean;
  userInfo?: {
    name?: string;
    email?: string;
    [key: string]: string | undefined;
  };
}

// Create a function to show the widget that can be called from anywhere
export const showTawkToChat = () => {
  if (window.Tawk_API && window.Tawk_API.showWidget) {
    window.Tawk_API.showWidget();
    setTimeout(() => {
      window.Tawk_API.maximize?.();
    }, 100);
    console.log('Tawk.to widget shown and maximized');
  } else {
    console.log('Tawk_API not available yet, cannot show widget');
  }
};

const TawkToChat: React.FC<TawkToChatProps> = ({ 
  tawkId = '67f6c249341807190ee14ba6/1ioduds7c', 
  autoHide = true,  // Changed default to true to hide by default
  userInfo 
}) => {
  const isMobile = useIsMobile();

  useEffect(() => {
    // Create a new variable to track if the script exists
    let tawkScript = document.querySelector('script[src*="embed.tawk.to"]');
    
    // If not found, create it
    if (!tawkScript) {
      tawkScript = document.createElement('script');
      tawkScript.setAttribute('async', 'true');
      tawkScript.setAttribute('crossorigin', '*');
      tawkScript.setAttribute('src', `https://embed.tawk.to/${tawkId}/default`);
      document.body.appendChild(tawkScript);
      
      console.log('TawkTo script added to the page');
    } else {
      // Update the script with the correct ID if it exists
      const currentSrc = tawkScript.getAttribute('src');
      const newSrc = `https://embed.tawk.to/${tawkId}/default`;
      if (currentSrc !== newSrc) {
        tawkScript.setAttribute('src', newSrc);
        console.log('TawkTo script source updated');
      }
    }

    // Function to immediately hide the widget, called repeatedly to ensure it stays hidden
    const forceHideWidget = () => {
      if (window.Tawk_API && window.Tawk_API.hideWidget) {
        window.Tawk_API.hideWidget();
      }
    };

    // Configure the widget for mobile and desktop
    const configureTawk = () => {
      if (window.Tawk_API) {
        console.log('Tawk.to API found, configuring...');
        
        // Immediately try to hide it
        forceHideWidget();
        
        window.Tawk_API.onLoaded = () => {
          console.log('Tawk.to widget loaded successfully');
          
          // Always hide the widget completely on initial load
          forceHideWidget();
          
          // Only show if explicitly requested (not auto-hide)
          if (!autoHide) {
            // Add a significant delay to ensure widget is fully initialized before showing
            setTimeout(() => {
              window.Tawk_API.showWidget?.();
              window.Tawk_API.minimize?.();
            }, 1500);
          }
          
          // Set visitor attributes if provided
          if (userInfo && Object.keys(userInfo).length > 0) {
            window.Tawk_API.setAttributes?.(userInfo, () => {
              console.log('User info set in Tawk.to');
            });
          }
        };
      } else {
        // If Tawk_API is not available yet, retry after a delay
        console.log('Tawk_API not yet available, retrying...');
        setTimeout(configureTawk, 1000);
      }
    };

    // Initial configuration attempt
    configureTawk();
    
    // Apply multiple hide attempts with increasing delays to catch any race conditions
    // This is especially helpful for mobile where timing can be inconsistent
    const hideAttempts = [100, 500, 1000, 2000, 3000];
    hideAttempts.forEach(delay => {
      setTimeout(forceHideWidget, delay);
    });
    
    return () => {
      // Clean up
      forceHideWidget();
    };
  }, [tawkId, autoHide, userInfo, isMobile]);

  // This component doesn't render anything visible
  return null;
};

export default TawkToChat;
