+++
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
date = '{{ .Date }}'
slug = '{{ replace .File.ContentBaseName " " "-" | strings.ToLower }}'
shortID = 'xxx'
times = [
  { step = 'prep', time = '' },
  { step = 'cook', time = '' }
]
recipeSource = 'Noonarbys'
ingredients = []
tags = []
servings = 4
draft = true
+++
