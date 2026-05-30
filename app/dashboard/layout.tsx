import { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { DashboardRouteGuard } from "@/components/dashboard-route-guard"
import { AdminLoginNotificationListener } from "@/components/admin-login-notification-listener"
import { PushNotificationManager } from "@/components/push-notification-manager"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { UserProvider } from "@/contexts/user-context"
import { DashboardFilterProvider } from "@/contexts/dashboard-filter-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div dir="rtl" className="no-scrollbar">
      <UserProvider>
        <AdminLoginNotificationListener />
        <PushNotificationManager />
        <DashboardFilterProvider>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(min(22vw, 220px))",
                "--header-height": "calc(var(--spacing) * 14)",
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="inset" />
            <SidebarInset>
              <SiteHeader />
              <div className="flex flex-1 flex-col bg-background overflow-y-auto no-scrollbar">
                <div className="@container/main flex flex-1 flex-col gap-2 overflow-y-auto no-scrollbar">
                  <div className="flex flex-col gap-6 pt-20 px-6 md:gap-8 md:pt-20 md:px-8 overflow-y-auto no-scrollbar">
                    <Suspense fallback={null}>
                      <DashboardRouteGuard>{children}</DashboardRouteGuard>
                    </Suspense>
                  </div>
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </DashboardFilterProvider>
      </UserProvider>
    </div>
  )
}
