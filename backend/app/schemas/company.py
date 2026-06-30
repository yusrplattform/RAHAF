from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CompanyBase(BaseModel):
    name: str
    activity_type: str
    status: str = "active"
    notes: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    activity_type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CompanySummary(CompanyResponse):
    total_income: float = 0
    total_expenses: float = 0
    net_profit: float = 0
    client_count: int = 0
