"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    children?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { setOpenMobile } = useSidebar()
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})

  const handleClick = () => {
    setOpenMobile(false)
  }

  const toggleDropdown = (title: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  return (
    <SidebarGroup dir="rtl">
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const hasChildren = !!item.children?.length
            const isOpen = !!openDropdowns[item.title]

            return (
              <SidebarMenuItem key={item.title}>
                {hasChildren ? (
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => toggleDropdown(item.title)}
                    className="relative mx-1 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-[#3dc1d3]/10 hover:to-transparent hover:text-[#3dc1d3] hover:shadow-md hover:shadow-[#3dc1d3]/10 active:bg-gradient-to-r active:from-[#3dc1d3]/20 active:to-transparent active:text-[#3dc1d3] data-[active=true]:bg-gradient-to-r data-[active=true]:from-[#3dc1d3]/15 data-[active=true]:to-transparent data-[active=true]:text-[#3dc1d3] data-[active=true]:font-semibold data-[active=true]:shadow-md data-[active=true]:shadow-[#3dc1d3]/15"
                  >
                    <span className="text-lg text-[#3dc1d3]">{item.icon}</span>
                    <span className="font-medium flex-1 text-right text-base">{item.title}</span>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 text-muted-foreground ${isOpen ? 'rotate-180 text-[#3dc1d3]' : ''}`} />
                  </SidebarMenuButton>
                ) : (
                  <Link href={item.url} className="w-full" onClick={handleClick}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className="relative mx-1 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-[#3dc1d3]/10 hover:to-transparent hover:text-[#3dc1d3] hover:shadow-md hover:shadow-[#3dc1d3]/10 hover:translate-x-1 active:bg-gradient-to-r active:from-[#3dc1d3]/20 active:to-transparent active:text-[#3dc1d3] data-[active=true]:bg-gradient-to-r data-[active=true]:from-[#3dc1d3]/15 data-[active=true]:to-transparent data-[active=true]:text-[#3dc1d3] data-[active=true]:font-semibold data-[active=true]:shadow-md data-[active=true]:shadow-[#3dc1d3]/15"
                    >
                      <span className="text-lg text-[#3dc1d3]">{item.icon}</span>
                      <span className="font-medium text-base">{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                )}

                {hasChildren && isOpen ? (
                  <div className="mt-2 space-y-1 pr-8 animate-in slide-in-from-right-2 duration-300">
                    {item.children?.map((child) => (
                      <Link key={child.title} href={child.url} className="block" onClick={handleClick}>
                        <SidebarMenuButton className="mx-1 rounded-lg text-sm text-muted-foreground hover:bg-gradient-to-r hover:from-[#3dc1d3]/10 hover:to-transparent hover:text-[#3dc1d3] transition-all duration-200">
                          <span className="font-medium">{child.title}</span>
                        </SidebarMenuButton>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
