from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    client_type = Column(String, default="individual")  # individual, company, entity
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    source = Column(String, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    service_type = Column(String, nullable=True)
    agreement_value = Column(Float, default=0)
    amount_paid = Column(Float, default=0)
    amount_remaining = Column(Float, default=0)
    status = Column(String, default="new")  # new, following, waiting_payment, paid, late, completed
    last_contact = Column(Date, nullable=True)
    next_follow_up = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company", back_populates="clients")
    incomes = relationship("Income", back_populates="client")
    tasks = relationship("Task", back_populates="client")
    transactions = relationship("Transaction", back_populates="client", cascade="all, delete-orphan")
