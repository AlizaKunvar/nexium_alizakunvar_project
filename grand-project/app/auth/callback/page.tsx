// app/auth/callback/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Handle the magic link
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession()
      if (!error) {
        router.push('/') // redirect to homepage
      } else {
        console.error('Auth error:', error.message)
        router.push('/error')
      }
    }

    handleCallback()
  }, [router])

  return <p>Logging you in...</p>
}
