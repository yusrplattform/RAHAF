from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    due_date = Column(Date, nullable=True)
    priority = Column(String, default="medium")  # low, medium, high
    status = Column(String, default="new")  # new, in_progress, completed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="tasks")
    client = relationship("Client", back_populates="tasks")
