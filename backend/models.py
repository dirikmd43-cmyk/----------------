from sqlalchemy import Column, Integer, String, Date, ForeignKey
from database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True)
    phone         = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role          = Column(String, default="client")


class Room(Base):
    __tablename__ = "rooms"

    id              = Column(Integer, primary_key=True)
    name            = Column(String, nullable=False)
    type            = Column(String, nullable=False)
    price_per_night = Column(Integer, nullable=False)
    description     = Column(String)
    image_url       = Column(String, nullable=True)


class Booking(Base):
    __tablename__ = "bookings"

    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    room_id     = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    check_in    = Column(Date, nullable=False)
    check_out   = Column(Date, nullable=False)
    total_price = Column(Integer, nullable=False)
    status      = Column(String, default="active")
