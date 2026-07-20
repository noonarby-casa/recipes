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

ingredients = [
  { category = "Main", items = [
    { qty = 1, unit = "unit", desc = "desc", item = "item", prep = "prep" },
  ] },
]
+++
