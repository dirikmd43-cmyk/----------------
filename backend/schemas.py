from datetime import date
from pydantic import BaseModel



class UserCreate(BaseModel):
    phone: str
    password: str


class UserResponse(BaseModel):
    id: int
    phone: str
    role: str

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class RoomCreate(BaseModel):
    name: str
    type: str
    price_per_night: int
    description: str
    image_url: str | None = None


class RoomResponse(BaseModel):
    id: int
    name: str
    type: str
    price_per_night: int
    description: str
    image_url: str | None = None

    model_config = {"from_attributes": True}


class BookingCreate(BaseModel):
    room_id: int
    check_in: date
    check_out: date


class BookingResponse(BaseModel):
    id: int
    user_id: int
    room_id: int
    check_in: date
    check_out: date
    total_price: int
    status: str

    model_config = {"from_attributes": True}
