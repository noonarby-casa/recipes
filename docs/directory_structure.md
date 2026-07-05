# Codebase Architecture & Directory Map

A tree-map of the project directories to help locate layouts, stylesheets, and pages quickly.

```text
├── .github/workflows/                    # CI/CD workflows
│   ├── firebase-hosting-merge.yml        # Deploy to production on merge to main
│   └── firebase-hosting-pull-request.yml # Deploy to Firebase preview channel on PR
├── archetypes/
│   └── default.md                        # Default Hugo archetype template for new content
├── assets/
│   └── tsconfig.json                     # TypeScript compiler path mapping configuration
├── content/                              # Site content (markdown pages)
│   ├── _index.md                         # Homepage content ("Here you will find recipes...")
│   ├── chorizo-roasted-red-pepper-spinach-gnocchi/
│   │   └── index.md                      # Example recipe leaf bundle
│   ├── plan/
│   │   └── index.md                      # Meal planner landing page leaf bundle
│   └── timers/
│       └── index.md                      # Private timers/alarm test bed page leaf bundle
├── themes/
│   └── cookpot/                          # Custom recipe theme folder
│       ├── assets/
│       │   ├── css/                      # Modular style sheets
│       │   │   ├── variables.css         # Theme-wide design variables/colors
│       │   │   ├── global.css            # Base resets and element rules
│       │   │   ├── recipe-list.css       # Recipe card/listing styles
│       │   │   ├── recipe-single.css     # Recipe single details and landscape layouts
│       │   │   ├── timers.css            # Pulse timers style rules
│       │   │   ├── meal-plan.css         # Calendar UI and planner styling
│       │   │   └── shopping-list.css     # Checkout-style shopping list styles
│       │   └── js/                       # Modular TypeScript (bundled by Hugo esbuild)
│       │       ├── main.ts               # Entry point and initializer
│       │       ├── constants.ts          # Global shared maps and constants
			│       │       ├── audio.ts              # Sound alarms logic
│       │       ├── scaler.ts             # Scaling calculation logic
│       │       ├── timers.ts             # Countdowns logic & wake lock requests
│       │       ├── fontsize.ts           # Custom instructions text-scaler logic
│       │       ├── search.ts             # Lazy-loaded recipe search logic
│       │       ├── random.ts             # Client-side random recipe selector logic
│       │       ├── darkmode.ts           # Client theme switching controls
│       │       ├── meal-plan.ts          # Meal planner logic, drag-and-drop, and conflict resolution
│       │       ├── units.ts              # Ingredient quantity parser & fraction standardizer
│       │       └── shopping-list/        # Shopping list logic core modules
│       │           ├── config.ts         # Cooking units and pantry staples catalog
│       │           ├── converters.ts     # Registry of custom packaging strategy converters
│       │           ├── pipeline.ts       # Raw ingredient aggregation & processing pipeline
│       │           ├── rules.ts          # Declarative ingredient grouping & staple rules config
│       │           ├── types.ts          # TypeScript type definitions for the shopping list pipeline
│       │           └── utils.ts          # Normalization and string parsers helpers
│       ├── layouts/
│       │   ├── _partials/                # Sub-templates directory
│       │   │   ├── head/                 # Scripts and style bundlers
│       │   │   │   ├── css.html          # Bundled stylesheet inline loader
│       │   │   │   └── js.html           # ESBuild script bundler and injection loader
│       │   │   ├── head.html                 # Page metadata layout shell (with dark mode inline script)
│       │   │   ├── header.html               # Site title banner and navigation layout
│       │   │   ├── footer.html               # Site copyright and footer links layout
│       │   │   ├── menu.html                 # Navigation menu structure
│       │   │   ├── terms.html                # Taxonomies terms layout template
│       │   │   ├── pagination.html           # Pagination buttons structure
│       │   │   ├── recipe-list-item.html     # Recipe card layout in lists
│       │   │   └── search.html               # Search input area structure
│       │   ├── baseof.html               # Main boilerplate layout shell
│       │   ├── home.html                 # Homepage layout template
│       │   ├── index.json                # JSON recipe search index template
│       │   ├── list.html                 # List/taxonomies layout template
│       │   ├── single.html               # Recipe detail layout (grid of Ingredients / Instructions)
│       │   ├── plan.html                 # Edit/View planner layout
│       │   └── timers.html               # Countdowns test suite layout
│       └── theme.toml                    # Theme metadata and taxonomies config
├── .firebaserc                           # Firebase project configuration mapping
├── firebase.json                         # Firebase hosting redirect and ignore rules
├── hugo.toml                             # Global Hugo configuration (baseURL, theme='cookpot', etc.)
├── package.json                          # PNPM project scripts and compiler tools dependencies
└── pnpm-lock.yaml                        # Locked dependency graph for deterministic installs
```
