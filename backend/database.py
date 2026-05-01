"""Подключение к SQLite и фабрика сессий."""

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# База всегда рядом с этим файлом, независимо от cwd при запуске uvicorn
_DB_FILE = Path(__file__).resolve().parent / "leads.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{_DB_FILE.as_posix()}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
