from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    service_type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_method = Column(String, nullable=True)  # cash, bank_transfer, check, online
    payment_status = Column(String, default="unpaid")  # paid, partial, unpaid
    amount_paid = Column(Float, default=0)
    amount_remaining = Column(Float, default=0)
    notes = Column(Text, nullable=True)
    receipt_file = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company", back_populates="incomes")
    client = relationship("Client", back_populates="incomes")
