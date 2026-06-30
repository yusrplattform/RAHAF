from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy import inspect, text
from .database import engine, Base
from .models import user, company, client, income, expense, task, crm
from .routers import auth, companies, income as income_router, expenses, clients, tasks, reports, crm as crm_router
from .config import settings

Base.metadata.create_all(bind=engine)

def ensure_existing_schema():
    inspector = inspect(engine)
    if "clients" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("clients")}
    additions = {
        "client_type": "VARCHAR DEFAULT 'individual'",
        "email": "VARCHAR",
        "source": "VARCHAR",
    }
    with engine.begin() as conn:
        for column, definition in additions.items():
            if column not in columns:
                conn.execute(text(f"ALTER TABLE clients ADD COLUMN {column} {definition}"))

ensure_existing_schema()

app = FastAPI(title="نظام إدارة الأعمال", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(income_router.router)
app.include_router(expenses.router)
app.include_router(clients.router)
app.include_router(tasks.router)
app.include_router(reports.router)
app.include_router(crm_router.router)

@app.get("/")
def root():
    return {"message": "نظام إدارة الأعمال - API يعمل بنجاح"}

@app.on_event("startup")
def create_default_owner():
    from .database import SessionLocal
    from .models.user import User
    from .auth.jwt_handler import get_password_hash
    db = SessionLocal()
    try:
        owner = db.query(User).filter(User.role == "owner").first()
        if not owner:
            owner = User(
                name="المالك",
                email="owner@rahaf.com",
                hashed_password=get_password_hash("admin123"),
                role="owner"
            )
            db.add(owner)
            db.commit()
    finally:
        db.close()
