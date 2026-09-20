from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

import models
import schemas
from database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "Recipe API is running"}


@app.post("/recipes", response_model=schemas.RecipeResponse)
def create_recipe(
    recipe: schemas.RecipeCreate,
    db: Session = Depends(get_db)
):
    new_recipe = models.Recipe(
        name=recipe.name,
        cuisine=recipe.cuisine,
        protein=recipe.protein,
        ingredients=recipe.ingredients,
        instructions=recipe.instructions,
        favourite=recipe.favourite
    )

    db.add(new_recipe)
    db.commit()
    db.refresh(new_recipe)

    return new_recipe


@app.get("/recipes", response_model=list[schemas.RecipeResponse])
def get_recipes(db: Session = Depends(get_db)):
    return db.query(models.Recipe).all()


@app.get("/recipes/{recipe_id}", response_model=schemas.RecipeResponse)
def get_recipe(
    recipe_id: int,
    db: Session = Depends(get_db)
):
    recipe = (
        db.query(models.Recipe)
        .filter(models.Recipe.id == recipe_id)
        .first()
    )

    if recipe is None:
        raise HTTPException(
            status_code=404,
            detail="Recipe not found"
        )

    return recipe

@app.delete("/recipes/{recipe_id}")
def delete_recipe(
    recipe_id: int,
    db: Session = Depends(get_db)
):
    recipe = (
        db.query(models.Recipe)
        .filter(models.Recipe.id == recipe_id)
        .first()
    )

    if recipe is None:
        raise HTTPException(
            status_code=404,
            detail="Recipe not found"
        )

    db.delete(recipe)
    db.commit()

    return {"message": "Recipe deleted successfully"}