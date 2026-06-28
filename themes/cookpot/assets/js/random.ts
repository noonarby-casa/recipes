export function initRandomRecipe(): void {
  const randomBtn = document.getElementById("header-random-recipe");
  if (!randomBtn) return;

  randomBtn.addEventListener("click", (e: MouseEvent) => {
    e.preventDefault();
    const recipesJson = randomBtn.getAttribute("data-recipes");
    if (!recipesJson) return;

    try {
      const recipes: string[] = JSON.parse(recipesJson);
      if (recipes && recipes.length > 0) {
        // Exclude the current page if possible to ensure we actually navigate somewhere else,
        // unless there's only one recipe in total.
        let targetRecipes = recipes;
        if (recipes.length > 1) {
          const currentPath = window.location.pathname;
          // Normalize paths by ensuring they end/start similarly
          const cleanPath = (path: string) =>
            path.replace(/\/+$/, "").toLowerCase();
          const currentClean = cleanPath(currentPath);

          targetRecipes = recipes.filter(
            (url) => cleanPath(url) !== currentClean,
          );
          if (targetRecipes.length === 0) {
            targetRecipes = recipes;
          }
        }

        const randomIndex = Math.floor(Math.random() * targetRecipes.length);
        const randomUrl = targetRecipes[randomIndex];
        window.location.href = randomUrl;
      }
    } catch (err) {
      console.error("Error parsing recipes for random redirect:", err);
    }
  });
}
