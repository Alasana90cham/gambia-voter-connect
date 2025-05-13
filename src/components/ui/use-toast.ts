
import { useToast, toast } from "@/hooks/use-toast";

// Optimize toast debouncing
const originalToast = toast;
let lastToastTime = 0;
const TOAST_DEBOUNCE_TIME = 1000; // 1 second

// Wrap toast function to prevent spam
const enhancedToast = (props) => {
  const now = Date.now();
  if (now - lastToastTime < TOAST_DEBOUNCE_TIME && props.variant !== "destructive") {
    return;
  }
  lastToastTime = now;
  return originalToast(props);
};

export { useToast, enhancedToast as toast };
