import type { ExternalToast } from 'sonner'
import { pushNotification } from '@/lib/push-notification'
import { showSonnerToast } from '@/lib/show-toast'

type ToastOptions = ExternalToast

function emit(message: string, isError: boolean, options?: ToastOptions) {
  showSonnerToast(message, options)
  pushNotification({
    type: isError ? 'error' : 'success',
    title: isError ? 'هەڵە' : 'ئاگادارکردنەوە',
    message,
  })
}

/** Toast + پانێڵی زەنگ — بۆ هەر شوێنێک کە تەنها toast بەکاردەهێنرێت */
export const toast = {
  show: (message: string, options?: ToastOptions) => emit(message, false, options),
  success: (message: string, options?: ToastOptions) => emit(message, false, options),
  error: (message: string, options?: ToastOptions) => emit(message, true, options),
  info: (message: string, options?: ToastOptions) => emit(message, false, options),
  warning: (message: string, options?: ToastOptions) => emit(message, false, options),
}
