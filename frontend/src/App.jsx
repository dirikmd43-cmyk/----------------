import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Home        from './pages/Home'
import Auth        from './pages/Auth'
import RoomDetails from './pages/RoomDetails'
import Dashboard   from './pages/Dashboard'
import AdminPanel  from './pages/AdminPanel'

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Логотип */}
        <Link to="/" className="text-blue-600 font-bold text-lg tracking-tight">
          🏨 HotelBook
        </Link>

        {/* Навигационные ссылки */}
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
            Номера
          </Link>

          {user && (
            <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
              Мои брони
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link to="/admin" className="text-gray-600 hover:text-blue-600 transition-colors">
              Админка
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-xs hidden sm:block">{user.phone}</span>
              <button
                onClick={handleLogout}
                className="text-red-500 hover:text-red-700 border border-red-200
                           hover:border-red-400 rounded-lg px-3 py-1 transition-colors"
              >
                Выйти
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium
                         rounded-lg px-4 py-1.5 transition-colors"
            >
              Войти
            </Link>
          )}
        </div>

      </div>
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Защищённый маршрут — только для авторизованных
// ---------------------------------------------------------------------------

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8 text-gray-500">Загрузка...</div>
  if (!user)   return <Navigate to="/login" replace />
  return children
}

// ---------------------------------------------------------------------------
// Маршрут только для администратора
// ---------------------------------------------------------------------------

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading)               return <div className="p-8 text-gray-500">Загрузка...</div>
  if (!user)                 return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

// ---------------------------------------------------------------------------
// Роутинг (внутри BrowserRouter, поэтому useNavigate в Navbar работает)
// ---------------------------------------------------------------------------

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen">
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/login"      element={<Auth />} />
          <Route path="/register"   element={<Auth />} />
          <Route path="/room/:id"   element={<RoomDetails />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute><Dashboard /></PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute><AdminPanel /></AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Корень приложения
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}
