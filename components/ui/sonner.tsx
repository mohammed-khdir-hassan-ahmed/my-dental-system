"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, Loader2Icon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

const TOAST_TEAL = "#3dc1d3"

const toastSurfaceClass =
  "flex w-full items-center gap-3 rounded-2xl border-0 bg-[#3dc1d3] px-5 py-3.5 text-white shadow-[0_4px_20px_rgba(61,193,211,0.35)]"

const toastIcon = <CircleCheckIcon className="size-5 shrink-0 text-white" strokeWidth={2} />

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      dir="rtl"
      icons={{
        success: toastIcon,
        info: toastIcon,
        warning: toastIcon,
        error: toastIcon,
        loading: <Loader2Icon className="size-5 shrink-0 animate-spin text-white" />,
      }}
      style={
        {
          "--normal-bg": TOAST_TEAL,
          "--normal-text": "#ffffff",
          "--normal-border": "transparent",
          "--success-bg": TOAST_TEAL,
          "--success-text": "#ffffff",
          "--success-border": "transparent",
          "--error-bg": TOAST_TEAL,
          "--error-text": "#ffffff",
          "--error-border": "transparent",
          "--warning-bg": TOAST_TEAL,
          "--warning-text": "#ffffff",
          "--warning-border": "transparent",
          "--info-bg": TOAST_TEAL,
          "--info-text": "#ffffff",
          "--info-border": "transparent",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: toastSurfaceClass,
          title: "text-sm font-medium text-white",
          description: "text-sm text-white/90",
          icon: "text-white",
          actionButton:
            "rounded-lg border border-white/30 bg-white/15 px-2.5 text-xs text-white hover:bg-white/25",
          cancelButton:
            "rounded-lg border border-white/30 bg-white/15 px-2.5 text-xs text-white hover:bg-white/25",
          closeButton: "text-white/80 hover:text-white",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
