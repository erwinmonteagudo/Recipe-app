from pydantic import BaseModel


class RecipeCreate(BaseModel):
    name: str
    cuisine: str | None = None
    protein: str | None = None
    image_url: str | None = None
    ingredients: list[str]
    instructions: list[str]
    favourite: bool = False


class RecipeResponse(RecipeCreate):
    id: int

    class Config:
        from_attributes = True