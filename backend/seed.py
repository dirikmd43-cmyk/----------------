"""
seed.py — начальное заполнение БД тестовыми данными.
Запуск: venv\Scripts\python.exe seed.py
Идемпотентен: повторный запуск не дублирует записи.
"""

from database import SessionLocal, engine, Base
from models import User, Room
from auth import hash_password

# Убеждаемся, что таблицы созданы (на случай запуска до main.py)
import models  # noqa: F401
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # ------------------------------------------------------------------ #
    # 1. Администратор                                                    #
    # ------------------------------------------------------------------ #
    if db.query(User).count() == 0:
        admin = User(
            phone="+79990000000",
            password_hash=hash_password("admin"),
            role="admin",
        )
        db.add(admin)
        print("   -> Администратор создан:")
        print("   Телефон : +79990000000")
        print("   Пароль  : admin")
        print("   Роль    : admin")
    else:
        print("-> Пользователи уже есть — пропускаю создание администратора.")

    # ------------------------------------------------------------------ #
    # 2. Номера                                                           #
    # ------------------------------------------------------------------ #
    if db.query(Room).count() == 0:
        rooms = [
            Room(
                name="Стандарт",
                type="Стандарт",
                price_per_night=3500,
                description=(
                    "Уютный номер для деловых поездок. Двуспальная кровать, "
                    "рабочий стол, кондиционер, бесплатный Wi-Fi и мини-бар."
                ),
                image_url="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
            ),
            Room(
                name="Комфорт",
                type="Комфорт",
                price_per_night=6500,
                description=(
                    "Просторный номер с панорамным видом на город. "
                    "Кинг-сайз кровать, ванная с джакузи, халаты и тапочки, "
                    "приветственные фрукты и шампанское."
                ),
                image_url="https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
            ),
            Room(
                name="Семейный Люкс",
                type="Люкс",
                price_per_night=12000,
                description=(
                    "Двухкомнатный люкс для семей с детьми. Отдельные спальни, "
                    "гостиная, детская кроватка по запросу, приставка и "
                    "собственный балкон с видом на сад."
                ),
                image_url="https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
            ),
            Room(
                name="Президентский",
                type="Президентский люкс",
                price_per_night=25000,
                description=(
                    "Вершина роскоши. Трёхкомнатные апартаменты с террасой, "
                    "личным дворецким 24/7, роялем, сауной и бассейном. "
                    "Панорамный вид на море и индивидуальный трансфер."
                ),
                image_url="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
            ),
        ]
        db.add_all(rooms)
        print("\n-> Добавлены номера:")
        for r in rooms:
            print(f"   • {r.name:<22} {r.type:<22} {r.price_per_night:>6} руб/ночь")
    else:
        print("-> Номера уже есть — пропускаю.")

    db.commit()
    print("\n-> База данных успешно заполнена.")

except Exception as e:
    db.rollback()
    print(f"\n[ОШИБКА] {e}")
    raise

finally:
    db.close()
