from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class TaskBase(BaseModel):
    title: str
    company_id: Optional[int] = None
    client_id: Optional[int] = None
    due_date: Optional[date] = None
    priority: str = "medium"
    status: str = "new"
    notes: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    company_id: Optional[int] = None
    client_id: Optional[int] = None
    due_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    company_name: Optional[str] = None
    client_name: Optional[str] = None

    class Config:
        from_attributes = True
