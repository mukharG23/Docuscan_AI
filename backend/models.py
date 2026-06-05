from sqlalchemy import Column, Integer, String, DateTime, Text , ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    extraction = relationship("Extraction", back_populates="document",uselist=False)

class Extraction(Base):
    __tablename__="extractions"

    id=Column(Integer,primary_key=True,index=True)
    doc_id=Column(Integer,ForeignKey("documents.id"),nullable=False)
    raw_text=Column(Text,nullable=False)
    structured_data = Column(Text, nullable=False)
    extracted_at = Column(DateTime, default=datetime.utcnow)
    document = relationship("Document", back_populates="extraction")