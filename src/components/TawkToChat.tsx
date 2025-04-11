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

const TawkToChat: React.FC<TawkToChatProps> = ({ 
  tawkId = '67f6c249341807190ee14ba6/1ioduds7c', 
  autoHide = false,
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

    // Configure the widget for mobile and desktop
    const configureTawk = () => {
      if (window.Tawk_API) {
        console.log('Tawk.to API found, configuring...');
        
        window.Tawk_API.onLoaded = () => {
          console.log('Tawk.to widget loaded successfully');
          
          // Always keep the widget minimized by default
          window.Tawk_API.minimize?.();
          
          // If autoHide is enabled, completely hide the widget
          if (autoHide) {
            window.Tawk_API.hideWidget?.();
          }
          
          // Mobile-specific adjustments
          if (isMobile) {
            console.log('Mobile device detected, applying mobile-specific settings');
            
            // For mobile, ensure we're starting minimized
            window.Tawk_API.minimize?.();
            
            // Add a small delay to ensure the widget is properly initialized on mobile
            setTimeout(() => {
              if (window.Tawk_API.isChatHidden && window.Tawk_API.isChatHidden()) {
                window.Tawk_API.showWidget?.();
                window.Tawk_API.minimize?.(); // Ensure it's minimized
              }
            }, 1000);
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
    
    return () => {
      // Clean up if needed
      if (window.Tawk_API && window.Tawk_API.hideWidget) {
        window.Tawk_API.hideWidget();
      }
    };
  }, [tawkId, autoHide, userInfo, isMobile]);

  // This component doesn't render anything visible
  return null;
};

export default TawkToChat;
