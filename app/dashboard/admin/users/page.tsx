'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AdminUsersRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/settings')
  }, [router])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#3dc1d3]" />
    </div>
  )
}
