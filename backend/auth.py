import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User

# --- Настройки ---
SECRET_KEY = "my_super_secret_key"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

# Схема для чтения Bearer-токена из заголовка Authorization
bearer_scheme = HTTPBearer()


# --- Пароли ---

def hash_password(password: str) -> str:
    """Возвращает bcrypt-хэш переданного пароля."""
    # Обрезаем до 72 байт из-за ограничений алгоритма bcrypt
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Сверяет открытый пароль с его хэшем."""
    pwd_bytes = plain_password.encode("utf-8")[:72]
    try:
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except ValueError:
        # Повреждённый/некорректный хэш в БД — считаем пароль неверным
        return False


# --- JWT ---

def create_access_token(user_id: int) -> str:
    """Создаёт JWT-токен с id пользователя и временем истечения."""
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# --- Dependency ---

def get_db():
    """Открывает сессию БД и закрывает её после запроса."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency: читает JWT из заголовка Authorization: Bearer <token>,
    проверяет его и возвращает объект пользователя из БД.
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise ValueError("Нет поля sub в токене")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Токен недействителен или истёк",
        )

    user = db.get(User, int(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден",
        )

    return user


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: пропускает запрос только если у пользователя role == 'admin'.
    Используй как Depends(get_admin_user) на эндпоинтах только для администратора.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ разрешён только администраторам",
        )
    return current_user
