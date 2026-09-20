from sqlalchemy import Boolean, Column, Integer, String, JSON
from database import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    cuisine = Column(String, nullable=True)
    protein = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    ingredients = Column(JSON, nullable=False)
    instructions = Column(JSON, nullable=False)
    favourite = Column(Boolean, default=False)