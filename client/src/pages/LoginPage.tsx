import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import api from '../services/api'

export default function LoginPage() {
  const { login } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      login(data.token, data.user)
      navigate('/')
    } catch {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img
            src="/branding/logo_dark.png"
            alt="Andrew Morgan"
            className={theme === 'dark' ? 'hidden' : 'block'}
            style={{ height: '64px' }}
          />
          <img
            src="/branding/logo_light.png"
            alt="Andrew Morgan"
            className={theme === 'dark' ? 'block' : 'hidden'}
            style={{ height: '64px' }}
          />
        </div>

        <h1 className="text-2xl font-bold text-brand-primary dark:text-brand-accent text-center">
          Application Monitor
        </h1>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-md font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
