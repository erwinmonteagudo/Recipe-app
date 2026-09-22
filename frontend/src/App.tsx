import { useEffect, useState } from "react"
import "./App.css"

type InstructionStep = {
  title: string
  text: string
}

type Recipe = {
  id: number
  name: string
  cuisine: string | null
  protein: string | null
  image_url: string | null
  ingredients: string[]
  instructions: InstructionStep[]
  favourite: boolean
}

type RecipeImageProps = {
  imageUrl: string | null
  recipeName: string
  className: string
}

function RecipeImage({
  imageUrl,
  recipeName,
  className,
}: RecipeImageProps) {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [imageUrl])

  if (!imageUrl || imageFailed) {
    return (
      <div className={`${className} recipe-image-fallback`}>
        <span>🍽️</span>
      </div>
    )
  }

  return (
    <img
      className={className}
      src={imageUrl}
      alt={recipeName}
      onError={() => setImageFailed(true)}
    />
  )
}

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  /*
    Randomiser state.

    randomSeenIds stores every recipe already shown during
    the current random cycle.

    lastRandomProtein stores the protein from the previous
    random suggestion so we can avoid showing the same
    protein consecutively whenever possible.
  */
  const [randomSeenIds, setRandomSeenIds] = useState<number[]>([])
  const [lastRandomProtein, setLastRandomProtein] = useState<string | null>(
    null
  )

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCuisine, setSelectedCuisine] = useState("")
  const [selectedProtein, setSelectedProtein] = useState("")

  const [name, setName] = useState("")
  const [cuisine, setCuisine] = useState("")
  const [protein, setProtein] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [ingredients, setIngredients] = useState("")
  const [instructions, setInstructions] = useState("")

  async function fetchRecipes() {
    const response = await fetch("http://127.0.0.1:8000/recipes")

    if (!response.ok) {
      throw new Error("Failed to load recipes")
    }

    const data: Recipe[] = await response.json()

    setRecipes(data)

    return data
  }

  async function loadRecipes() {
    try {
      const data = await fetchRecipes()

      setRecipes(data)
      setSelectedRecipe(null)
      setShowAddForm(false)
      setEditingRecipe(null)

      setSearchTerm("")
      setSelectedCuisine("")
      setSelectedProtein("")
      setShowFavouritesOnly(false)

      resetRandomCycle()
    } catch (error) {
      console.error(error)
      alert("Could not load recipes from the backend")
    }
  }

  useEffect(() => {
    async function loadInitialRecipes() {
      try {
        await fetchRecipes()
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialRecipes()
  }, [])

  /*
    Whenever the user changes a search/filter, start a new
    random cycle because the eligible recipe pool has changed.
  */
  useEffect(() => {
    resetRandomCycle()
  }, [
    searchTerm,
    selectedCuisine,
    selectedProtein,
    showFavouritesOnly,
  ])

  function resetRandomCycle() {
    setRandomSeenIds([])
    setLastRandomProtein(null)
  }

  function resetForm() {
    setName("")
    setCuisine("")
    setProtein("")
    setImageUrl("")
    setIngredients("")
    setInstructions("")
    setEditingRecipe(null)
  }

  function openAddRecipeForm() {
    resetForm()
    setSelectedRecipe(null)
    setShowAddForm(true)
  }

  function startEditing(recipe: Recipe) {
    setEditingRecipe(recipe)

    setName(recipe.name)
    setCuisine(recipe.cuisine ?? "")
    setProtein(recipe.protein ?? "")
    setImageUrl(recipe.image_url ?? "")
    setIngredients(recipe.ingredients.join("\n"))

    setInstructions(
      recipe.instructions
        .map((step) =>
          step.title
            ? `${step.title} | ${step.text}`
            : step.text
        )
        .join("\n")
    )

    setSelectedRecipe(null)
    setShowAddForm(true)
  }

  async function addRecipe(event: React.FormEvent) {
    event.preventDefault()

    const recipeData = {
      name,
      cuisine,
      protein,
      image_url: imageUrl || null,

      ingredients: ingredients
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item !== ""),

      instructions: instructions
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "")
        .map((line) => {
          const separatorIndex = line.indexOf("|")

          if (separatorIndex === -1) {
            return {
              title: "",
              text: line,
            }
          }

          return {
            title: line.slice(0, separatorIndex).trim(),
            text: line.slice(separatorIndex + 1).trim(),
          }
        }),

      favourite: editingRecipe?.favourite ?? false,
    }

    const url = editingRecipe
      ? `http://127.0.0.1:8000/recipes/${editingRecipe.id}`
      : "http://127.0.0.1:8000/recipes"

    const method = editingRecipe ? "PUT" : "POST"

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recipeData),
      })

      if (!response.ok) {
        const errorData = await response.json()

        alert(
          "Failed to save recipe: " +
            JSON.stringify(errorData)
        )

        return
      }

      resetForm()
      resetRandomCycle()

      await loadRecipes()
    } catch (error) {
      console.error(error)
      alert("Could not connect to the backend")
    }
  }

  async function deleteRecipe(recipeId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this recipe?"
    )

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/recipes/${recipeId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const errorData = await response.json()

        alert(
          "Failed to delete recipe: " +
            JSON.stringify(errorData)
        )

        return
      }

      setSelectedRecipe(null)
      resetRandomCycle()

      await loadRecipes()
    } catch (error) {
      console.error(error)
      alert("Could not connect to the backend")
    }
  }

  async function toggleFavourite(recipe: Recipe) {
    const updatedRecipe = {
      name: recipe.name,
      cuisine: recipe.cuisine,
      protein: recipe.protein,
      image_url: recipe.image_url,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      favourite: !recipe.favourite,
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/recipes/${recipe.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedRecipe),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update favourite")
      }

      const updatedData: Recipe = await response.json()

      setSelectedRecipe(updatedData)

      setRecipes((currentRecipes) =>
        currentRecipes.map((item) =>
          item.id === updatedData.id
            ? updatedData
            : item
        )
      )
    } catch (error) {
      console.error(error)
      alert("Could not update favourite")
    }
  }

  const cuisineOptions = Array.from(
    new Set(
      recipes
        .map((recipe) => recipe.cuisine)
        .filter(
          (value): value is string =>
            value !== null &&
            value.toLowerCase() !== "asian"
        )
    )
  ).sort()

  const proteinOptions = Array.from(
    new Set(
      recipes
        .map((recipe) => recipe.protein)
        .filter(
          (value): value is string =>
            value !== null
        )
    )
  ).sort()

  const visibleRecipes = recipes.filter((recipe) => {
    const search = searchTerm.toLowerCase().trim()

    const matchesSearch =
      search === "" ||
      recipe.name.toLowerCase().includes(search) ||
      (recipe.protein?.toLowerCase().includes(search) ?? false) ||
      (recipe.cuisine?.toLowerCase().includes(search) ?? false)

    const matchesCuisine =
      selectedCuisine === "" ||
      recipe.cuisine === selectedCuisine

    const matchesProtein =
      selectedProtein === "" ||
      recipe.protein === selectedProtein

    const matchesFavourite =
      !showFavouritesOnly || recipe.favourite

    return (
      matchesSearch &&
      matchesCuisine &&
      matchesProtein &&
      matchesFavourite
    )
  })

  function pickRandomRecipe() {
    if (visibleRecipes.length === 0) {
      alert("No recipes match your current filters.")
      return
    }

    /*
      First get recipes that have NOT been shown during
      the current cycle.
    */
    let unseenRecipes = visibleRecipes.filter(
      (recipe) => !randomSeenIds.includes(recipe.id)
    )

    /*
      If every eligible recipe has been shown, the cycle
      is complete.

      Start a fresh cycle.
    */
    let nextSeenIds = randomSeenIds

    if (unseenRecipes.length === 0) {
      unseenRecipes = [...visibleRecipes]
      nextSeenIds = []
    }

    /*
      Try to avoid the same protein appearing twice
      consecutively.

      For example:

      Chicken
      Beef
      Pork
      Chicken

      rather than:

      Chicken
      Chicken
      Chicken

      If the user has filtered specifically to Beef,
      obviously every result can still be Beef.

      Likewise, if there genuinely isn't another protein
      available, we allow the repeat rather than getting stuck.
    */
    let candidateRecipes = unseenRecipes

    if (lastRandomProtein !== null) {
      const differentProteinRecipes = unseenRecipes.filter(
        (recipe) =>
          recipe.protein !== lastRandomProtein
      )

      if (differentProteinRecipes.length > 0) {
        candidateRecipes = differentProteinRecipes
      }
    }

    /*
      Pick randomly ONLY from the currently valid candidates.
    */
    const randomIndex = Math.floor(
      Math.random() * candidateRecipes.length
    )

    const randomRecipe = candidateRecipes[randomIndex]

    /*
      Mark this recipe as seen in the current cycle.
    */
    setRandomSeenIds([
      ...nextSeenIds,
      randomRecipe.id,
    ])

    /*
      Remember its protein for the next randomisation.
    */
    setLastRandomProtein(
      randomRecipe.protein ?? null
    )

    /*
      Show the chosen recipe.
    */
    setSelectedRecipe(randomRecipe)
    setShowAddForm(false)
    setEditingRecipe(null)
  }

  function clearFilters() {
    setSearchTerm("")
    setSelectedCuisine("")
    setSelectedProtein("")
    setShowFavouritesOnly(false)
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

        <button onClick={openAddRecipeForm}>
          Add Recipe
        </button>

        <button
          onClick={() =>
            setShowFavouritesOnly(
              (currentValue) => !currentValue
            )
          }
        >
          {showFavouritesOnly
            ? "Show All Recipes"
            : "Show Favourites"}
        </button>
      </div>

      {!showAddForm && !selectedRecipe && recipes.length > 0 && (
        <section className="filters">
          <input
            className="search-input"
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />

          <div className="filter-row">
            <select
              value={selectedCuisine}
              onChange={(event) =>
                setSelectedCuisine(event.target.value)
              }
            >
              <option value="">All cuisines</option>

              {cuisineOptions.map((cuisineOption) => (
                <option
                  key={cuisineOption}
                  value={cuisineOption}
                >
                  {cuisineOption}
                </option>
              ))}
            </select>

            <select
              value={selectedProtein}
              onChange={(event) =>
                setSelectedProtein(event.target.value)
              }
            >
              <option value="">All proteins</option>

              {proteinOptions.map((proteinOption) => (
                <option
                  key={proteinOption}
                  value={proteinOption}
                >
                  {proteinOption}
                </option>
              ))}
            </select>

            <button onClick={clearFilters}>
              Clear Filters
            </button>
          </div>

          <p className="recipe-count">
            {visibleRecipes.length} recipe
            {visibleRecipes.length !== 1 ? "s" : ""} found
          </p>
        </section>
      )}

      {showAddForm ? (
        <section className="add-recipe-form">
          <h2>
            {editingRecipe
              ? "Edit Recipe"
              : "Add Recipe"}
          </h2>

          <form onSubmit={addRecipe}>
            <label>
              Recipe Name
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
              />
            </label>

            <label>
              Cuisine
              <input
                value={cuisine}
                onChange={(event) =>
                  setCuisine(event.target.value)
                }
              />
            </label>

            <label>
              Protein
              <input
                value={protein}
                onChange={(event) =>
                  setProtein(event.target.value)
                }
              />
            </label>

            <label>
              Image URL
              <input
                value={imageUrl}
                onChange={(event) =>
                  setImageUrl(event.target.value)
                }
                placeholder="https://..."
              />
            </label>

            <label>
              Ingredients — one per line
              <textarea
                value={ingredients}
                onChange={(event) =>
                  setIngredients(event.target.value)
                }
                required
              />
            </label>

            <label>
              Instructions — use Title | Instruction
              <textarea
                value={instructions}
                onChange={(event) =>
                  setInstructions(event.target.value)
                }
                placeholder={
                  "Fry the onions | Heat the oil and fry until golden.\nCook the chicken | Season and cook until browned."
                }
                required
              />
            </label>

            <button type="submit">
              {editingRecipe
                ? "Update Recipe"
                : "Save Recipe"}
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm()
                setShowAddForm(false)
              }}
            >
              Cancel
            </button>
          </form>
        </section>
      ) : selectedRecipe ? (
        <section className="recipe-details">
          <button
            onClick={() =>
              setSelectedRecipe(null)
            }
          >
            ← Back
          </button>

          <button
            onClick={() =>
              startEditing(selectedRecipe)
            }
          >
            Edit Recipe
          </button>

          <button
            onClick={() =>
              deleteRecipe(selectedRecipe.id)
            }
          >
            Delete Recipe
          </button>

          <button
            onClick={() =>
              toggleFavourite(selectedRecipe)
            }
          >
            {selectedRecipe.favourite
              ? "★ Remove Favourite"
              : "☆ Add to Favourites"}
          </button>

          <RecipeImage
            imageUrl={selectedRecipe.image_url}
            recipeName={selectedRecipe.name}
            className="recipe-detail-image"
          />

          <h2>
            {selectedRecipe.favourite ? "★ " : ""}
            {selectedRecipe.name}
          </h2>

          <p>
            {selectedRecipe.cuisine} •{" "}
            {selectedRecipe.protein}
          </p>

          <h3>Ingredients</h3>

          <ul>
            {selectedRecipe.ingredients.map(
              (ingredient, index) => (
                <li key={index}>
                  {ingredient}
                </li>
              )
            )}
          </ul>

          <h3>Instructions</h3>

          <ol>
            {selectedRecipe.instructions.map(
              (instruction, index) => (
                <li key={index}>
                  {instruction.title && (
                    <strong>
                      {instruction.title}
                    </strong>
                  )}

                  {instruction.title && <br />}

                  {instruction.text}
                </li>
              )
            )}
          </ol>
        </section>
      ) : (
        <section className="recipe-list">
          {isLoading ? (
            <p>Loading recipes...</p>
          ) : visibleRecipes.length > 0 ? (
            visibleRecipes.map((recipe) => (
              <button
                className="recipe-card"
                key={recipe.id}
                onClick={() =>
                  setSelectedRecipe(recipe)
                }
              >
                <RecipeImage
                  imageUrl={recipe.image_url}
                  recipeName={recipe.name}
                  className="recipe-card-image"
                />

                <div>
                  <h2>
                    {recipe.favourite ? "★ " : ""}
                    {recipe.name}
                  </h2>

                  <p>
                    {recipe.cuisine} • {recipe.protein}
                  </p>
                </div>
              </button>
            ))
          ) : showFavouritesOnly ? (
            <p>
              No favourite recipes match your filters.
            </p>
          ) : (
            <p>No recipes found.</p>
          )}
        </section>
      )}
    </main>
  )
}

export default App