from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, SessionLocal


models.Base.metadata.create_all(bind=engine)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
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
    instruction_data = [
        instruction.model_dump()
        for instruction in recipe.instructions
    ]

    new_recipe = models.Recipe(
        name=recipe.name,
        cuisine=recipe.cuisine,
        protein=recipe.protein,
        image_url=recipe.image_url,
        ingredients=recipe.ingredients,
        instructions=instruction_data,
        favourite=recipe.favourite,
    )

    db.add(new_recipe)
    db.commit()
    db.refresh(new_recipe)

    return new_recipe


@app.post(
    "/recipes/bulk",
    response_model=list[schemas.RecipeResponse]
)
def create_recipes_bulk(
    recipes: list[schemas.RecipeCreate],
    db: Session = Depends(get_db)
):
    new_recipes = []

    for recipe in recipes:
        instruction_data = [
            instruction.model_dump()
            for instruction in recipe.instructions
        ]

        new_recipe = models.Recipe(
            name=recipe.name,
            cuisine=recipe.cuisine,
            protein=recipe.protein,
            image_url=recipe.image_url,
            ingredients=recipe.ingredients,
            instructions=instruction_data,
            favourite=recipe.favourite,
        )

        db.add(new_recipe)
        new_recipes.append(new_recipe)

    db.commit()

    for recipe in new_recipes:
        db.refresh(recipe)

    return new_recipes


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


@app.put("/recipes/{recipe_id}", response_model=schemas.RecipeResponse)
def update_recipe(
    recipe_id: int,
    updated_recipe: schemas.RecipeCreate,
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

    instruction_data = [
        instruction.model_dump()
        for instruction in updated_recipe.instructions
    ]

    recipe.name = updated_recipe.name
    recipe.cuisine = updated_recipe.cuisine
    recipe.protein = updated_recipe.protein
    recipe.image_url = updated_recipe.image_url
    recipe.ingredients = updated_recipe.ingredients
    recipe.instructions = instruction_data
    recipe.favourite = updated_recipe.favourite

    db.commit()
    db.refresh(recipe)

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