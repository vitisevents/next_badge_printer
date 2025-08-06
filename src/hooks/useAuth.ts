'use client'

import { useState, useEffect } from 'react'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem('badge-printer-auth')
    setIsAuthenticated(authStatus === 'true')
    setIsLoading(false)
  }, [])

  const login = () => {
    setIsAuthenticated(true)
    localStorage.setItem('badge-printer-auth', 'true')
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('badge-printer-auth')
  }

  return {
    isAuthenticated,
    isLoading,
    login,
    logout
  }
}