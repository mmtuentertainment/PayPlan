# Python Patterns Guide

## Modern Python Project Structure

### Flask/FastAPI Application

```
project/
├── app/
│   ├── api/              # API endpoints
│   │   ├── v1/
│   │   │   ├── users.py
│   │   │   └── products.py
│   │   └── deps.py       # Dependencies
│   ├── core/             # Core configuration
│   │   ├── config.py
│   │   ├── security.py
│   │   └── settings.py
│   ├── models/           # Data models
│   │   ├── user.py
│   │   └── product.py
│   ├── schemas/          # Pydantic schemas
│   │   ├── user.py
│   │   └── product.py
│   ├── services/         # Business logic
│   │   ├── user_service.py
│   │   └── product_service.py
│   └── db/              # Database
│       ├── base.py
│       └── session.py
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── alembic/             # Database migrations
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
└── main.py
```

### Django Project Structure

```
project/
├── apps/                # Django apps
│   ├── users/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── admin.py
│   └── products/
├── config/             # Project configuration
│   ├── settings/
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   ├── urls.py
│   └── wsgi.py
├── core/               # Shared functionality
│   ├── models.py       # Abstract models
│   ├── mixins.py
│   └── utils.py
├── static/
├── templates/
└── manage.py
```

## Python Package Structure

### Library/Package Structure

```
my_package/
├── src/
│   └── my_package/
│       ├── __init__.py
│       ├── core/
│       │   ├── __init__.py
│       │   └── base.py
│       ├── utils/
│       │   ├── __init__.py
│       │   └── helpers.py
│       └── py.typed      # Type hints marker
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/
│   ├── conf.py
│   └── index.rst
├── pyproject.toml       # Modern Python packaging
├── setup.cfg           # Setup configuration
└── README.md
```

## Import Organization

### Standard Import Order

```python
# Standard library imports
import os
import sys
from pathlib import Path
from typing import List, Optional

# Third-party imports
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine

# Local application imports
from app.core.config import settings
from app.models.user import User
from app.services.auth import AuthService

# Relative imports (only in packages)
from .utils import helper_function
from ..models import BaseModel
```

## Design Patterns

### Repository Pattern

```python
# repositories/base.py
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List

T = TypeVar('T')

class BaseRepository(ABC, Generic[T]):
    @abstractmethod
    async def get(self, id: int) -> Optional[T]:
        pass
    
    @abstractmethod
    async def get_all(self) -> List[T]:
        pass
    
    @abstractmethod
    async def create(self, obj: T) -> T:
        pass
    
    @abstractmethod
    async def update(self, id: int, obj: T) -> Optional[T]:
        pass
    
    @abstractmethod
    async def delete(self, id: int) -> bool:
        pass

# repositories/user_repository.py
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User
from .base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, session: Session):
        self.session = session
    
    async def get(self, id: int) -> Optional[User]:
        return self.session.query(User).filter(User.id == id).first()
    
    async def get_all(self) -> List[User]:
        return self.session.query(User).all()
    
    async def create(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user
```

### Service Layer Pattern

```python
# services/user_service.py
from typing import Optional, List
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import User
from app.core.security import hash_password

class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository
    
    async def get_user(self, user_id: int) -> Optional[User]:
        return await self.repository.get(user_id)
    
    async def create_user(self, user_data: UserCreate) -> User:
        # Business logic
        hashed_password = hash_password(user_data.password)
        user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name
        )
        return await self.repository.create(user)
    
    async def update_user(
        self, 
        user_id: int, 
        user_data: UserUpdate
    ) -> Optional[User]:
        user = await self.repository.get(user_id)
        if not user:
            return None
        
        # Update fields
        for field, value in user_data.dict(exclude_unset=True).items():
            setattr(user, field, value)
        
        return await self.repository.update(user_id, user)
```

### Dependency Injection

```python
# core/dependencies.py
from functools import lru_cache
from typing import Generator
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@lru_cache()
def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)

@lru_cache()
def get_user_service(
    repository: UserRepository = Depends(get_user_repository)
) -> UserService:
    return UserService(repository)

# api/v1/users.py
from fastapi import APIRouter, Depends
from app.services.user_service import UserService
from app.core.dependencies import get_user_service

router = APIRouter()

@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service)
):
    return await service.get_user(user_id)
```

### Factory Pattern

```python
# factories/database_factory.py
from abc import ABC, abstractmethod
from typing import Dict, Type

class Database(ABC):
    @abstractmethod
    def connect(self):
        pass
    
    @abstractmethod
    def disconnect(self):
        pass

class PostgresDatabase(Database):
    def connect(self):
        return "Connected to PostgreSQL"
    
    def disconnect(self):
        return "Disconnected from PostgreSQL"

class MongoDatabase(Database):
    def connect(self):
        return "Connected to MongoDB"
    
    def disconnect(self):
        return "Disconnected from MongoDB"

class DatabaseFactory:
    _databases: Dict[str, Type[Database]] = {
        "postgres": PostgresDatabase,
        "mongodb": MongoDatabase,
    }
    
    @classmethod
    def create(cls, database_type: str) -> Database:
        database_class = cls._databases.get(database_type)
        if not database_class:
            raise ValueError(f"Unknown database type: {database_type}")
        return database_class()

# Usage
db = DatabaseFactory.create("postgres")
db.connect()
```

### Strategy Pattern

```python
# strategies/payment.py
from abc import ABC, abstractmethod
from decimal import Decimal

class PaymentStrategy(ABC):
    @abstractmethod
    def calculate_fee(self, amount: Decimal) -> Decimal:
        pass
    
    @abstractmethod
    def process_payment(self, amount: Decimal) -> bool:
        pass

class CreditCardPayment(PaymentStrategy):
    def calculate_fee(self, amount: Decimal) -> Decimal:
        return amount * Decimal("0.029") + Decimal("0.30")
    
    def process_payment(self, amount: Decimal) -> bool:
        # Process credit card payment
        return True

class PayPalPayment(PaymentStrategy):
    def calculate_fee(self, amount: Decimal) -> Decimal:
        return amount * Decimal("0.034") + Decimal("0.49")
    
    def process_payment(self, amount: Decimal) -> bool:
        # Process PayPal payment
        return True

class PaymentProcessor:
    def __init__(self, strategy: PaymentStrategy):
        self.strategy = strategy
    
    def process(self, amount: Decimal) -> bool:
        fee = self.strategy.calculate_fee(amount)
        total = amount + fee
        return self.strategy.process_payment(total)

# Usage
processor = PaymentProcessor(CreditCardPayment())
processor.process(Decimal("100.00"))
```

## Testing Structure

### Test Organization

```python
# tests/unit/test_user_service.py
import pytest
from unittest.mock import Mock, AsyncMock
from app.services.user_service import UserService
from app.schemas.user import UserCreate

class TestUserService:
    @pytest.fixture
    def mock_repository(self):
        return Mock()
    
    @pytest.fixture
    def user_service(self, mock_repository):
        return UserService(mock_repository)
    
    @pytest.mark.asyncio
    async def test_create_user(self, user_service, mock_repository):
        # Arrange
        user_data = UserCreate(
            email="test@example.com",
            password="password123",
            full_name="Test User"
        )
        mock_repository.create = AsyncMock()
        
        # Act
        result = await user_service.create_user(user_data)
        
        # Assert
        mock_repository.create.assert_called_once()
        assert result is not None

# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base

@pytest.fixture(scope="session")
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    yield SessionLocal()
    Base.metadata.drop_all(bind=engine)
```

## Async Patterns

### Async Context Manager

```python
# utils/async_context.py
from typing import AsyncContextManager
import aiohttp

class AsyncHTTPClient(AsyncContextManager):
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(base_url=self.base_url)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get(self, endpoint: str):
        async with self.session.get(endpoint) as response:
            return await response.json()

# Usage
async def fetch_data():
    async with AsyncHTTPClient("https://api.example.com") as client:
        data = await client.get("/users")
        return data
```

### Async Queue Pattern

```python
# workers/task_queue.py
import asyncio
from typing import Callable, Any

class AsyncTaskQueue:
    def __init__(self, num_workers: int = 3):
        self.queue = asyncio.Queue()
        self.num_workers = num_workers
    
    async def worker(self, worker_id: int):
        while True:
            task = await self.queue.get()
            try:
                await task()
            except Exception as e:
                print(f"Worker {worker_id} error: {e}")
            finally:
                self.queue.task_done()
    
    async def add_task(self, task: Callable):
        await self.queue.put(task)
    
    async def run(self):
        workers = [
            asyncio.create_task(self.worker(i))
            for i in range(self.num_workers)
        ]
        
        await self.queue.join()
        
        for worker in workers:
            worker.cancel()
```

## Configuration Management

### Settings with Pydantic

```python
# core/config.py
from typing import Optional, List
from pydantic import BaseSettings, validator
from functools import lru_cache

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "My Application"
    DEBUG: bool = False
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10
    
    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = []
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
```

## Common Anti-Patterns to Avoid

### ❌ Mutable Default Arguments

```python
# Bad
def add_item(item, items=[]):
    items.append(item)
    return items

# Good
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

### ❌ Broad Exception Handling

```python
# Bad
try:
    result = risky_operation()
except:
    pass

# Good
try:
    result = risky_operation()
except (ValueError, TypeError) as e:
    logger.error(f"Operation failed: {e}")
    raise
```

### ❌ God Classes

```python
# Bad
class UserManager:
    def create_user(self): pass
    def authenticate(self): pass
    def send_email(self): pass
    def generate_report(self): pass
    def backup_database(self): pass

# Good - Separate concerns
class UserService:
    def create_user(self): pass

class AuthService:
    def authenticate(self): pass

class EmailService:
    def send_email(self): pass
```

## Best Practices

### Type Hints

```python
from typing import Optional, List, Dict, Union
from datetime import datetime

def process_user_data(
    user_id: int,
    data: Dict[str, Union[str, int]],
    timestamp: Optional[datetime] = None
) -> Optional[Dict[str, any]]:
    """Process user data and return formatted result."""
    if timestamp is None:
        timestamp = datetime.utcnow()
    
    # Processing logic
    return {"user_id": user_id, "processed_at": timestamp}
```

### Dataclasses

```python
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime

@dataclass
class User:
    id: int
    email: str
    name: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    roles: List[str] = field(default_factory=list)
    is_active: bool = True
    
    def has_role(self, role: str) -> bool:
        return role in self.roles
    
    def __post_init__(self):
        # Validation after initialization
        if "@" not in self.email:
            raise ValueError("Invalid email address")
```

### Context Managers

```python
from contextlib import contextmanager
import time

@contextmanager
def timer(label: str):
    start = time.time()
    print(f"Starting {label}...")
    try:
        yield
    finally:
        end = time.time()
        print(f"{label} took {end - start:.2f} seconds")

# Usage
with timer("Database query"):
    # Perform database operations
    pass
```
