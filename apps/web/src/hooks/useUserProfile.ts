import { useState, useCallback } from 'react'
import { UserProfile } from '@/types'

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取用户配置
  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/user-profile')
      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }
      
      const result = await response.json()
      setProfile(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching user profile:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // 保存用户配置
  const saveProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save user profile')
      }
      
      const result = await response.json()
      setProfile(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error saving user profile:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    profile,
    loading,
    error,
    fetchProfile,
    saveProfile,
  }
} 