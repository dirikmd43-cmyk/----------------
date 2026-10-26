import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  // Переключатель между формами входа и регистрации
  const [mode, setMode] = useState('login') // 'login' | 'register'

  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        // Регистрируем пользователя
        await api.post('/register', { phone, password })
        // После регистрации — сразу логиним
      }

      // Получаем токен
      const response = await api.post('/login', { phone, password })
      await login(response.data.access_token)
      navigate('/')

    } catch (err) {
      setError(err.response?.data?.detail || 'Что-то пошло не так')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">

        {/* Заголовок */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          {mode === 'login' ? 'Вход в систему' : 'Регистрация'}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          {mode === 'login' ? 'Войдите, чтобы бронировать номера' : 'Создайте аккаунт — это бесплатно'}
        </p>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Номер телефона
            </label>
            <input
              type="text"
              placeholder="+79991234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                       text-white font-semibold rounded-lg py-2 transition-colors"
          >
            {loading ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        {/* Переключатель режима */}
        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          {' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            className="text-blue-600 hover:underline font-medium"
          >
            {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </p>

      </div>
    </div>
  )
}
