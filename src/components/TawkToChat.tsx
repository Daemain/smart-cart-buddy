
import React, { useEffect } from 'react';

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
  tawkId = 'YOUR_TAWK_ID', 
  autoHide = false,
  userInfo 
}) => {
  useEffect(() => {
    // Update the Tawk.to script with the correct ID
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src.includes('embed.tawk.to')) {
        const newSrc = `https://embed.tawk.to/${tawkId}/default`;
        if (scripts[i].src !== newSrc) {
          scripts[i].src = newSrc;
        }
        break;
      }
    }

    // Configure Tawk.to when loaded
    if (window.Tawk_API) {
      window.Tawk_API.onLoaded = () => {
        console.log('Tawk.to widget loaded');
        
        // Auto-hide widget if enabled
        if (autoHide) {
          window.Tawk_API.hideWidget?.();
        }
        
        // Set visitor attributes if provided
        if (userInfo && Object.keys(userInfo).length > 0) {
          window.Tawk_API.setAttributes?.(userInfo, () => {
            console.log('User info set in Tawk.to');
          });
        }
      };
    }
    
    return () => {
      // Clean up if needed
      if (window.Tawk_API && window.Tawk_API.hideWidget) {
        window.Tawk_API.hideWidget();
      }
    };
  }, [tawkId, autoHide, userInfo]);

  // This component doesn't render anything visible
  return null;
};

export default TawkToChat;
