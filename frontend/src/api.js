import axios from 'axios'

// Базовый инстанс Axios — все запросы идут на бэкенд
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
})

// Interceptor: перед каждым запросом проверяем localStorage.
// Если токен есть — добавляем заголовок Authorization автоматически.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
