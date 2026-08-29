
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { motion } from "framer-motion"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  const getToastIcon = (variant?: "default" | "destructive" | "success") => {
    switch (variant) {
      case "destructive":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "success": 
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-orange-400" />;
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Toast {...props} className="border border-white/10 backdrop-blur-lg">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getToastIcon(variant as "default" | "destructive" | "success")}
                </div>
                <div className="grid gap-1 flex-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && (
                    <ToastDescription>{description}</ToastDescription>
                  )}
                </div>
              </div>
              {action}
              <ToastClose />
            </Toast>
          </motion.div>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
