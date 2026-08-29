/**
 * useUserGender — reads the user's gender from onboarding_v2.step_data.gender
 *
 * Returns the gender string ("Male" | "Female" | "Other" | null) so components
 * can show gender-appropriate demo wardrobes. Caches locally; no re-fetch on
 * every render.
 */

import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export function useUserGender(): {
  gender: string | null
  isLoading: boolean
} {
  const [gender, setGender] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchGender() {
      try {
        const { data: auth } = await supabase.auth.getUser()
        if (!auth?.user) {
          if (!cancelled) setIsLoading(false)
          return
        }

        const { data } = await supabase
          .from("onboarding_v2")
          .select("step_data")
          .eq("user_id", auth.user.id)
          .maybeSingle()

        if (cancelled) return

        const stepData = (data?.step_data as Record<string, any>) ?? {}
        const userGender = stepData?.gender?.gender ?? null

        setGender(typeof userGender === "string" ? userGender : null)
      } catch {
        // Silent — non-critical
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchGender()
    return () => { cancelled = true }
  }, [])

  return { gender, isLoading }
}
