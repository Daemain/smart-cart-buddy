
import { toast as sonnerToast } from "sonner";
import type { ExternalToast } from "sonner";

// Set a longer duration for toasts by default (5000ms = 5 seconds)
const defaultDuration = 5000;

// Type for toast options
type ToastOptions = ExternalToast & {
  duration?: number;
};

function toast(props: { 
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
} & ToastOptions) {
  const { title, description, variant, duration = defaultDuration, ...rest } = props;

  if (variant === "destructive") {
    sonnerToast.error(title, {
      description,
      duration,
      ...rest,
    });
  } else {
    sonnerToast(title, {
      description,
      duration,
      ...rest,
    });
  }
}

// Add properties to toast function
toast.defaultDuration = defaultDuration;

// Create our own useToast hook
function useToast() {
  return {
    toast,
    toasts: [],
    dismiss: sonnerToast.dismiss,
    message: sonnerToast,
  };
}

export { useToast, toast };
