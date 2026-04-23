"use client"

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LogOutIcon } from "lucide-react"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    isOTPLogin?: boolean
  }
}) {
  const router = useRouter()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      if (response.ok) {
        setIsConfirmOpen(false)
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex flex-col items-center gap-1 px-2 -pb-1 border-t pt-3">
          {/* Email */}
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px] leading-tight text-center">
            {user.isOTPLogin ? '*****' : user.email}
          </p>
          
          {/* User Profile Image and Logout Button */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
              <Image
                src="/images/my.jpg"
                alt={user.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 hover:border-destructive/50 transition-all duration-200 font-medium text-xs dark:bg-destructive/5 dark:hover:bg-destructive/10"
            >
              <span>چونەدەرەوە</span>
              <LogOutIcon className="size-3" />
            </button>
          </div>

          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogContent dir="rtl" className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">دڵنیابوونەوەی چونەدەرەوە</DialogTitle>
                <DialogDescription className="text-center">
                  ئایا دڵنیایت دەتەوێت لە سیستەمەکە بچیتە دەرەوە؟
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-row-reverse gap-2 sm:justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={isLoggingOut}
                >
                  پاشگەزبوونەوە
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'چاوەڕوانبە...' : 'بەڵێ ، دەچمە دەرەوە'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
