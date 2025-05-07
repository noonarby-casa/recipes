# Recipe Website

This is a Hugo project for a recipe website. It uses the `cookpot` theme and is
deployed to Firebase Hosting. The live site can be found at
https://recipes.noonarby.casa/.

The content for the recipes is located in the `content` directory. The main page
is `content/_index.md`.

## Recipe Structure

Each recipe is a markdown file with the following structure:

```markdown
+++
title = 'Recipe Title'
date = YYYY-MM-DDTHH:MM:SS-TZ
ingredients = [
  "Ingredient 1",
  "Ingredient 2",
  "..."
]
+++

## Instructions

1. Step 1
2. Step 2
3. ...
```

- The `title` and `date` are standard Hugo front matter fields.
- The `ingredients` field is a list of strings, with each string being a single
  ingredient.
- The instructions are placed in the body of the markdown file, under an `##
  Instructions` heading.
