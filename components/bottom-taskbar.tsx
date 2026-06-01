'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarCheck, ShoppingCart, CreditCard, Wallet } from 'lucide-react'

const taskbarItems = [
  {
    label: 'داشبۆرد',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'نۆرەگرتن',
    href: '/dashboard/appointments',
    icon: CalendarCheck,
  },
  {
    label: 'فرۆشتن',
    href: '/dashboard/seller',
    icon: ShoppingCart,
  },
  {
    label: 'قیستەکان',
    href: '/dashboard/installments',
    icon: CreditCard,
  },
  {
    label: 'خەرجیەکان',
    href: '/dashboard/expenses',
    icon: Wallet,
  },
]

const hoverBg = 'rgba(61,193,211,0.15)'
const hoverColor = '#3dc1d3'
const activeBg = 'rgba(61,193,211,0.20)'
const shadowColor = 'rgba(61,193,211,0.30)'

export function BottomTaskbar() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50" dir="rtl">
      <nav
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.30)',
        }}
        className="flex items-center gap-1 p-2 rounded-[22px]"
      >
        {taskbarItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href} className="group relative">
              <div
                style={isActive ? {
                  background: activeBg,
                  boxShadow: `0 3px 12px ${shadowColor}`,
                } : {}}
                className={`
                  flex flex-col items-center gap-1 px-4 py-2 rounded-[14px]
                  transition-all duration-150 ease-out select-none cursor-pointer
                  ${isActive ? 'scale-[1.04]' : 'hover:scale-[1.05] active:scale-95'}
                `}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    const el = e.currentTarget
                    el.style.background = hoverBg
                    el.style.boxShadow = `0 3px 10px ${shadowColor}`
                    el.querySelector('.dock-icon')?.setAttribute('style', `color: ${hoverColor}`)
                    el.querySelector('.dock-label')?.setAttribute('style', `color: ${hoverColor}`)
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    const el = e.currentTarget
                    el.style.background = ''
                    el.style.boxShadow = ''
                    el.querySelector('.dock-icon')?.setAttribute('style', '')
                    el.querySelector('.dock-label')?.setAttribute('style', '')
                  }
                }}
              >
                <Icon
                  className="dock-icon w-[18px] h-[18px] transition-colors duration-150"
                  style={{ color: isActive ? hoverColor : undefined }}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                <span
                  className="dock-label text-[9.5px] font-semibold leading-none tracking-wide transition-colors duration-150"
                  style={{ color: isActive ? hoverColor : undefined }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
