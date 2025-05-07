# Project Overview

This is a Hugo project for a recipe website. It uses the `cookpot` theme and is deployed to Firebase Hosting. The live site can be found at https://recipes.noonarby.casa/.

The content for the recipes is located in the `content` directory. The main page is `content/_index.md`.

# Hugo Documentation

The Hugo documentation can be found at https://gohugo.io/documentation/.

# Building and Running

## Running Locally

To run the website locally for development, use the following command:

```bash
hugo server
```

This will start a local server, and you can view the site at `http://localhost:1313/recipes/`.

## Building for Production

To build the static site for production, use the following command:

```bash
hugo serve --renderToDisk --disableFastRender
```

This will generate the static files in the `public` directory.

# Deployment

The project is automatically deployed to Firebase Hosting on every push to the `main` branch. The deployment configuration is defined in `firebase.json` and the deployment workflow is in `.github/workflows/firebase-hosting-merge.yml`.
