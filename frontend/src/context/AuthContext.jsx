import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

// Создаём контекст — он будет доступен любому компоненту через useAuth()
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)   // данные пользователя (id, phone, role)
  const [token, setToken] = useState(null)   // JWT-токен
  const [loading, setLoading] = useState(true) // ждём проверки токена при старте

  // При первой загрузке проверяем, есть ли сохранённый токен.
  // Если есть — запрашиваем GET /me, чтобы восстановить сессию.
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (!savedToken) {
      setLoading(false)
      return
    }

    setToken(savedToken)

    api.get('/me')
      .then((response) => {
        setUser(response.data)
      })
      .catch(() => {
        // Токен недействителен (истёк или повреждён) — очищаем
        localStorage.removeItem('token')
        setToken(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Вызывается после успешного /login — сохраняем токен и загружаем профиль
  const login = async (newToken) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)

    const response = await api.get('/me')
    setUser(response.data)
  }

  // Выход — удаляем токен и сбрасываем состояние
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Хук для удобного доступа к контексту из любого компонента
export function useAuth() {
  return useContext(AuthContext)
}
