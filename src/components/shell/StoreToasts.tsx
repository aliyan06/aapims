import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAppStore } from "@/store";

/**
 * Renders store toast payloads through the existing sonner setup.
 * Mounted once by DeviceStage, outside the device frames.
 */
export function StoreToasts() {
  const toasts = useAppStore((s) => s.ui.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  useEffect(() => {
    toasts.forEach((payload) => {
      const show =
        payload.tone === "error"
          ? toast.error
          : payload.tone === "success"
            ? toast.success
            : payload.tone === "info"
              ? toast.info
              : toast;
      show(payload.title, { description: payload.description, id: payload.id });
      dismissToast(payload.id);
    });
  }, [toasts, dismissToast]);

  return <Toaster position="bottom-center" />;
}
