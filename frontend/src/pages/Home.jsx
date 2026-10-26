import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Home() {
  const [rooms, setRooms]       = useState([])
  const [checkIn, setCheckIn]   = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false) // был ли запущен поиск

  const navigate = useNavigate()

  // При первой загрузке — получаем все номера
  useEffect(() => {
    fetchAllRooms()
  }, [])

  const fetchAllRooms = async () => {
    setLoading(true)
    try {
      const response = await api.get('/rooms')
      setRooms(response.data)
    } finally {
      setLoading(false)
    }
    setSearched(false)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.get('/rooms/available', {
        params: { check_in: checkIn, check_out: checkOut },
      })
      setRooms(response.data)
      setSearched(true)
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка поиска')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCheckIn('')
    setCheckOut('')
    fetchAllRooms()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Блок умного поиска */}
      <div className="bg-blue-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-1">🔍 Умный поиск</h2>
        <p className="text-blue-100 text-sm mb-4">Найдите свободные номера на нужные даты</p>

        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-blue-100 text-xs mb-1">Дата заезда</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
              className="rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-blue-100 text-xs mb-1">Дата выезда</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
              className="rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-white text-blue-600 font-semibold px-5 py-2 rounded-lg
                       hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            Найти
          </button>

          {searched && (
            <button
              type="button"
              onClick={handleReset}
              className="text-blue-100 hover:text-white text-sm underline"
            >
              Сбросить
            </button>
          )}
        </form>
      </div>

      {/* Заголовок списка */}
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        {searched ? '✅ Свободные номера' : '🏨 Все номера отеля'}
      </h1>
      {searched && (
        <p className="text-sm text-gray-500 mb-4">
          Заезд: <b>{checkIn}</b> — Выезд: <b>{checkOut}</b>
        </p>
      )}

      {/* Состояния загрузки и пустого результата */}
      {loading && <p className="text-gray-500">Загрузка...</p>}

      {!loading && rooms.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">😔</p>
          <p>{searched ? 'Нет свободных номеров на эти даты' : 'Номера не найдены'}</p>
        </div>
      )}

      {/* Сетка карточек номеров */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} onDetails={() => navigate(`/room/${room.id}`)} />
        ))}
      </div>

    </div>
  )
}

function RoomCard({ room, onDetails }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden
                    hover:shadow-md transition-shadow flex flex-col">
      {room.image_url && (
        <img
          src={room.image_url}
          alt={room.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
      )}
      <div className="p-5 flex flex-col flex-1">
        {/* Тип-бейдж */}
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600
                         bg-blue-50 rounded-full px-2 py-0.5 w-fit mb-3">
          {room.type}
        </span>

        <h3 className="text-lg font-bold text-gray-800 mb-1">{room.name}</h3>
        <p className="text-sm text-gray-500 flex-1 mb-4 line-clamp-2">{room.description}</p>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-blue-600 font-bold text-lg">
            {room.price_per_night.toLocaleString('ru-RU')} ₽
            <span className="text-gray-400 font-normal text-sm"> / ночь</span>
          </span>
          <button
            onClick={onDetails}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                       px-4 py-1.5 rounded-lg transition-colors"
          >
            Подробнее
          </button>
        </div>
      </div>
    </div>
  )
}
