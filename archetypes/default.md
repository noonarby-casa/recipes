+++
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
date = '{{ .Date }}'
slug = '{{ replace .File.ContentBaseName " " "-" | strings.ToLower }}'
shortId = 'xxx'
times = [
  { step = 'prep', time = '' },
  { step = 'cook', time = '' }
]
recipeSource = 'Noonarbys'
tags = []
servings = 4
draft = true

[[ingredients]]
  # category = "Main" (optional grouping)
  [[ingredients.items]]
    qty = 1
    unit = "cup"
    item = "ingredient name"
    # desc = "optional descriptor (e.g. fresh)"
    # prep = "optional prep (e.g. diced)"
    # optional = true
    # [ingredients.items.alt]
    #   item = "alternate item"
    #   qty = 1
    #   unit = "tablespoon"
+++
