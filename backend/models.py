from sqlalchemy import Boolean, Column, Integer, String
from database import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    cuisine = Column(String, nullable=True)
    protein = Column(String, nullable=True)
    ingredients = Column(String, nullable=False)
    instructions = Column(String, nullable=False)
    favourite = Column(Boolean, default=False)