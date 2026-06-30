from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_number = Column(String, unique=True, index=True, nullable=False)
    transaction_type = Column(String, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    status = Column(String, nullable=False)
    priority = Column(String, default="medium")
    assigned_to = Column(String, nullable=True)
    next_follow_up = Column(Date, nullable=True)
    service_value = Column(Float, default=0)
    amount_paid = Column(Float, default=0)
    amount_remaining = Column(Float, default=0)
    payment_status = Column(String, default="unpaid")
    notes = Column(Text, nullable=True)
    extra_data = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    client = relationship("Client", back_populates="transactions")
    company = relationship("Company")
    timeline = relationship("TransactionTimeline", back_populates="transaction", cascade="all, delete-orphan")
    documents = relationship("TransactionDocument", back_populates="transaction", cascade="all, delete-orphan")
    payments = relationship("TransactionPayment", back_populates="transaction", cascade="all, delete-orphan")
    tasks = relationship("TransactionTask", back_populates="transaction", cascade="all, delete-orphan")
    attachments = relationship("TransactionAttachment", back_populates="transaction", cascade="all, delete-orphan")


class TransactionTimeline(Base):
    __tablename__ = "transaction_timeline"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    action_date = Column(DateTime(timezone=True), server_default=func.now())
    action_type = Column(String, nullable=False)
    employee = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    attachment_path = Column(String, nullable=True)

    transaction = relationship("Transaction", back_populates="timeline")


class TransactionDocument(Base):
    __tablename__ = "transaction_documents"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    name = Column(String, nullable=False)
    status = Column(String, default="required")
    received_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transaction = relationship("Transaction", back_populates="documents")


class TransactionPayment(Base):
    __tablename__ = "transaction_payments"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_date = Column(Date, server_default=func.current_date())
    method = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transaction = relationship("Transaction", back_populates="payments")


class TransactionTask(Base):
    __tablename__ = "transaction_tasks"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    title = Column(String, nullable=False)
    due_date = Column(Date, nullable=True)
    priority = Column(String, default="medium")
    status = Column(String, default="open")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transaction = relationship("Transaction", back_populates="tasks")


class TransactionAttachment(Base):
    __tablename__ = "transaction_attachments"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    transaction = relationship("Transaction", back_populates="attachments")
