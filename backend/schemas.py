from pydantic import BaseModel


class RecipeCreate(BaseModel):
    name: str
    cuisine: str | None = None
    protein: str | None = None
    ingredients: str
    instructions: str
    favourite: bool = False


class RecipeResponse(RecipeCreate):
    id: int

    class Config:
        from_attributes = True