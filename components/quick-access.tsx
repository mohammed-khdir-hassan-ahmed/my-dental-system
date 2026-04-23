"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { 
  CalendarIcon, 
  ShoppingCartIcon, 
  UsersIcon, 
  DollarSignIcon, 
  TrendingDownIcon, 
  BarChart3Icon,
  ArrowLeftIcon 
} from "lucide-react"

const quickAccessItems = [
  {
    title: "دانیشتنەکان",
    description: "بەڕێوەبردنی دانیشتنەکان",
    icon: CalendarIcon,
    href: "/dashboard/appointments",
    gradient: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    iconBg: "bg-gradient-to-r from-blue-500 to-cyan-500",
  },
  {
    title: "فرۆشتن",
    description: "بەڕێوەبردنی فرۆشتن",
    icon: ShoppingCartIcon,
    href: "/dashboard/seller",
    gradient: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    iconBg: "bg-gradient-to-r from-emerald-500 to-teal-500",
  },
  {
    title: "کارمەندەکان",
    description: "بەڕێوەبردنی کارمەندەکان",
    icon: UsersIcon,
    href: "/dashboard/staff",
    gradient: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    iconBg: "bg-gradient-to-r from-purple-500 to-pink-500",
  },
  {
    title: "قیستەکان",
    description: "بەڕێوەبردنی قیستەکان",
    icon: DollarSignIcon,
    href: "/dashboard/installments",
    gradient: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    iconBg: "bg-gradient-to-r from-orange-500 to-amber-500",
  },
  {
    title: "خەرجییەکان",
    description: "بەڕێوەبردنی خەرجییەکان",
    icon: TrendingDownIcon,
    href: "/dashboard/expenses",
    gradient: "from-red-500 to-rose-500",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    iconBg: "bg-gradient-to-r from-red-500 to-rose-500",
  },
  {
    title: "ڕاپۆرتەکان",
    description: "بینینی ڕاپۆرتەکان",
    icon: BarChart3Icon,
    href: "/dashboard/reports",
    gradient: "from-indigo-500 to-violet-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    iconBg: "bg-gradient-to-r from-indigo-500 to-violet-500",
  },
]

export function QuickAccess() {
  return (
    <div className="px-4 lg:px-6">
      <Card className="border-0  bg-white dark:bg-slate-900">
        <CardContent className="pt-6">
        <div className="mb-6 text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">دەستپێڕاگەیشتن خێرا</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">بەشە سەرەکییەکانی سیستەمەکە</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          {quickAccessItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group"
              >
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition duration-300 rounded-xl" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))`, '--tw-gradient-from': item.gradient.split(' ')[1], '--tw-gradient-to': item.gradient.split(' ')[3] } as any} />
                  <div className={`relative ${item.bgColor} hover:bg-white dark:hover:bg-slate-700 rounded-xl p-4 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${item.iconBg} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="size-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r ${item.gradient} group-hover:bg-clip-text transition-all`}>
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <ArrowLeftIcon className="size-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
