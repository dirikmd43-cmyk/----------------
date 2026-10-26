from datetime import date
from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base
from models import User, Room, Booking
from schemas import UserCreate, UserResponse, Token, RoomCreate, RoomResponse, BookingCreate, BookingResponse
from auth import hash_password, verify_password, create_access_token, get_db, get_current_user, get_admin_user

import models  # noqa: F401 — нужен, чтобы SQLAlchemy увидел модели до create_all

app = FastAPI(title="Hotel Booking API")

# CORS — разрешаем запросы с любого origin (для учебного проекта)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаём все таблицы при старте
Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Служебные
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Авторизация
# ---------------------------------------------------------------------------

@app.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя по номеру телефона и паролю."""

    existing = db.query(User).filter(User.phone == user_data.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким номером уже существует",
        )

    new_user = User(
        phone=user_data.phone,
        password_hash=hash_password(user_data.password),
        role="client",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login", response_model=Token)
def login(user_data: UserCreate, db: Session = Depends(get_db)):
    """Вход по номеру телефона и паролю. Возвращает JWT-токен."""

    user = db.query(User).filter(User.phone == user_data.phone).first()

    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный номер телефона или пароль",
        )

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@app.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Возвращает данные текущего авторизованного пользователя."""
    return current_user


# ---------------------------------------------------------------------------
# Номера
# ---------------------------------------------------------------------------

@app.get("/rooms", response_model=list[RoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    """Возвращает список всех номеров. Доступно без авторизации."""
    return db.query(Room).all()


@app.get("/rooms/available", response_model=list[RoomResponse])
def get_available_rooms(
    check_in: date = Query(..., description="Дата заезда (YYYY-MM-DD)"),
    check_out: date = Query(..., description="Дата выезда (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """
    Умный поиск свободных номеров.

    Алгоритм:
    1. Находим все активные брони, которые пересекаются с запрошенным периодом.
       Два периода [A, B) и [C, D) пересекаются если: A < D и B > C.
       Для нас: booking.check_in < check_out AND booking.check_out > check_in.
    2. Собираем room_id из этих броней — это занятые номера.
    3. Возвращаем все номера, чей id НЕ входит в список занятых.
    """
    if check_in >= check_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Дата выезда должна быть позже даты заезда",
        )

    # Шаг 1: id номеров, занятых в указанный период
    busy_room_ids = (
        db.query(Booking.room_id)
        .filter(
            Booking.status != "cancelled",      # не отменённые брони
            Booking.check_in < check_out,       # бронь начинается до нашего выезда
            Booking.check_out > check_in,       # бронь заканчивается после нашего заезда
        )
        .all()
    )

    # .all() возвращает список кортежей [(room_id,), ...] — извлекаем значения
    busy_ids = [row.room_id for row in busy_room_ids]

    # Шаг 2: все номера, которых нет в занятых
    available_rooms = db.query(Room).filter(Room.id.not_in(busy_ids)).all()

    return available_rooms


@app.get("/rooms/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db)):
    """Возвращает информацию об одном номере по его id."""
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Номер не найден",
        )
    return room


@app.post("/rooms", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    room_data: RoomCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),   # только администратор
):
    """Создаёт новый номер. Доступно только пользователям с role='admin'."""
    new_room = Room(**room_data.model_dump())
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room


# ---------------------------------------------------------------------------
# Бронирования
# ---------------------------------------------------------------------------

@app.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Создание бронирования.

    Расчёт стоимости:
        nights      = (check_out - check_in).days   # количество ночей
        total_price = nights * room.price_per_night  # итоговая цена
    """
    # а) Валидация дат
    if booking_data.check_in >= booking_data.check_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Дата выезда должна быть позже даты заезда",
        )

    # б) Ищем номер в БД, чтобы получить цену за ночь
    room = db.get(Room, booking_data.room_id)
    if room is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Номер не найден",
        )

    # в) Проверяем, не занят ли номер на эти даты
    #    Условие пересечения: бронь начинается ДО нашего выезда
    #    И заканчивается ПОСЛЕ нашего заезда.
    conflict = (
        db.query(Booking)
        .filter(
            Booking.room_id == booking_data.room_id,
            Booking.status != "cancelled",         # отменённые не считаются
            Booking.check_in < booking_data.check_out,
            Booking.check_out > booking_data.check_in,
        )
        .first()
    )
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Номер уже занят на выбранные даты",
        )

    # г) Расчёт стоимости
    nights = (booking_data.check_out - booking_data.check_in).days
    total_price = nights * room.price_per_night

    # д) Сохраняем бронирование в БД
    new_booking = Booking(
        user_id=current_user.id,
        room_id=booking_data.room_id,
        check_in=booking_data.check_in,
        check_out=booking_data.check_out,
        total_price=total_price,
        status="active",
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return new_booking


@app.get("/bookings/me", response_model=list[BookingResponse])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Возвращает все бронирования текущего авторизованного пользователя."""
    return db.query(Booking).filter(Booking.user_id == current_user.id).all()


@app.get("/bookings", response_model=list[BookingResponse])
def get_all_bookings(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Возвращает все бронирования в системе. Только для администратора."""
    return db.query(Booking).all()


@app.patch("/bookings/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Отмена бронирования (status → 'cancelled').
    Клиент может отменить только свою бронь.
    Администратор может отменить любую.
    """
    booking = db.get(Booking, booking_id)

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено",
        )

    # Клиент может управлять только своими бронями
    if current_user.role != "admin" and booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет прав для отмены этого бронирования",
        )

    if booking.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Бронирование уже отменено",
        )

    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)

    return booking
