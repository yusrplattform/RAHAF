from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    activity_type = Column(String, nullable=False)
    status = Column(String, default="active")  # active, inactive, suspended
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    incomes = relationship("Income", back_populates="company")
    expenses = relationship("Expense", back_populates="company")
    clients = relationship("Client", back_populates="company")
    tasks = relationship("Task", back_populates="company")
