import { toast as sonnerToast, type ExternalToast } from 'sonner'

/** پیشاندانی toast بە Sonner — بێ پانێڵی زەنگ (بۆ نۆتیفیکەیشنی تەواو لە notify.ts) */
export function showSonnerToast(message: string, options?: ExternalToast) {
  return sonnerToast.success(message, options)
}
