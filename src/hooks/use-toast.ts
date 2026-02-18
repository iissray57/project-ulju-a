// Minimal toast hook for compatibility
// TODO: Implement full toast system or migrate to sonner

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = (props: ToastProps) => {
    // Fallback to console for now
    console.log(`[Toast] ${props.title}: ${props.description}`);
  };

  return { toast };
}
