from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Путь к файлу базы данных SQLite
DATABASE_URL = "sqlite:///./hotel.db"

# Создаём движок. check_same_thread=False нужен только для SQLite
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Фабрика сессий для работы с БД
SessionLocal = sessionmaker(bind=engine)


# Базовый класс, от которого будут наследоваться все модели
class Base(DeclarativeBase):
    pass
