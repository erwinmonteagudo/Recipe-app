import { useState } from "react"

type Recipe = {
  id: number
  name: string
  cuisine: string | null
  protein: string | null
  ingredients: string
  instructions: string
  favourite: boolean
}

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const [name, setName] = useState("")
  const [cuisine, setCuisine] = useState("")
  const [protein, setProtein] = useState("")
  const [ingredients, setIngredients] = useState("")
  const [instructions, setInstructions] = useState("")

  async function loadRecipes() {
    const response = await fetch("http://127.0.0.1:8000/recipes")
    const data = await response.json()

    setRecipes(data)
    setSelectedRecipe(null)
    setShowAddForm(false)
  }

  async function pickRandomRecipe() {
  const response = await fetch("http://127.0.0.1:8000/recipes")
  const data: Recipe[] = await response.json()

  if (data.length === 0) {
    alert("You don't have any recipes yet")
    return
  }

  const randomIndex = Math.floor(Math.random() * data.length)
  const randomRecipe = data[randomIndex]

  setRecipes(data)
  setSelectedRecipe(randomRecipe)
  setShowAddForm(false)
}

  async function addRecipe(event: React.FormEvent) {
    event.preventDefault()

    const response = await fetch("http://127.0.0.1:8000/recipes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        cuisine,
        protein,
        ingredients,
        instructions,
        favourite: false,
      }),
    })

    if (!response.ok) {
      alert("Something went wrong when adding the recipe")
      return
    }

    setName("")
    setCuisine("")
    setProtein("")
    setIngredients("")
    setInstructions("")
    setShowAddForm(false)

    await loadRecipes()
  }

  return (
    <main>
      <h1>Recipe App</h1>

      <div className="menu-buttons">
        <button onClick={pickRandomRecipe}>
          Pick a Random Recipe
        </button>

        <button onClick={loadRecipes}>
          View All Recipes
        </button>

        <button
          onClick={() => {
            setShowAddForm(true)
            setSelectedRecipe(null)
          }}
        >
          Add Recipe
        </button>
      </div>

      {showAddForm ? (
        <section className="add-recipe-form">
          <h2>Add Recipe</h2>

          <form onSubmit={addRecipe}>
            <label>
              Recipe Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label>
              Cuisine
              <input
                value={cuisine}
                onChange={(event) => setCuisine(event.target.value)}
              />
            </label>

            <label>
              Protein
              <input
                value={protein}
                onChange={(event) => setProtein(event.target.value)}
              />
            </label>

            <label>
              Ingredients
              <textarea
                value={ingredients}
                onChange={(event) => setIngredients(event.target.value)}
                required
              />
            </label>

            <label>
              Instructions
              <textarea
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                required
              />
            </label>

            <button type="submit">
              Save Recipe
            </button>

            <button
              type="button"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
          </form>
        </section>
      ) : selectedRecipe ? (
        <section className="recipe-details">
          <button onClick={() => setSelectedRecipe(null)}>
            ← Back
          </button>

          <h2>{selectedRecipe.name}</h2>

          <p>
            {selectedRecipe.cuisine} • {selectedRecipe.protein}
          </p>

          <h3>Ingredients</h3>
          <p>{selectedRecipe.ingredients}</p>

          <h3>Instructions</h3>
          <p>{selectedRecipe.instructions}</p>
        </section>
      ) : (
        <section className="recipe-list">
          {recipes.map((recipe) => (
            <button
              className="recipe-card"
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
            >
              <h2>{recipe.name}</h2>
              <p>{recipe.cuisine}</p>
              <p>{recipe.protein}</p>
            </button>
          ))}
        </section>
      )}
    </main>
  )
}

export default App