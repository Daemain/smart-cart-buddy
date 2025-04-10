
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Function to check if the device is mobile
    const checkMobile = () => {
      const mobileCheck = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobileCheck);
      console.log(`Device detected as: ${mobileCheck ? 'mobile' : 'desktop'}`);
    };

    // Initial check - run immediately to avoid flash of incorrect UI
    checkMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkMobile);
    
    // Create a media query list and add listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Use a standardized function for the event listener
    const onChange = () => {
      checkMobile();
    };
    
    // Different browsers support different event listener methods
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
    } else if (mql.addListener) {
      // For older browsers
      mql.addListener(onChange);
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (mql.removeEventListener) {
        mql.removeEventListener("change", onChange);
      } else if (mql.removeListener) {
        mql.removeListener(onChange);
      }
    };
  }, []);

  // Return true if definitely mobile, false otherwise
  // This ensures we have a boolean value even before the effect runs
  return typeof isMobile === 'boolean' ? isMobile : window.innerWidth < MOBILE_BREAKPOINT;
}
