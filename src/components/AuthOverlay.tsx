
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface AuthOverlayProps {
  isOpen: boolean;
}

const AuthOverlay: React.FC<AuthOverlayProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent className="sm:max-w-md" hideCloseButton={true}>
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <h3 className="text-lg font-medium">Authenticating...</h3>
          <p className="text-sm text-muted-foreground text-center">
            You're being securely redirected to complete the authentication process.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthOverlay;
