# Grill Session: US Grocery Package Sizes for Missing Ingredients

## Closed Decisions

### Q1. Target Scope & Category Prioritization

- **Question:** Which categories of missing ingredients should we prioritize for adding package sizes, and should this be an exhaustive pass or scoped?
- **Decision:** Focus on named priority categories (Dairy, Broths, Canned goods, Dry Grains/Baking, and Cured/Pre-packaged Meats) rather than attempting loose produce and variable-weight items.
- **Details:**
  - Categories in scope: Dairy & Eggs, Canned Goods & Broths, Dry Grains & Pasta, Baking Ingredients, Pre-packaged / Cured Meats.
  - Out of scope for this pass: Loose produce (sold each/by count) and raw variable-weight butchered meats (sold per pound).

### Q2. Package Size String Naming Conventions

- **Question:** What naming format should we standardize on for package size entries in `us-grocery.json`?
- **Decision:** Standardize strictly on Container-first format (`"container (size)"`, e.g., `"can (15 oz)"`, `"tub (32 oz)"`, `"bag (5 lb)"`, `"package (1 lb)"`), and normalize existing non-conforming entries.
- **Details:**
  - Enables clean pluralization of the container keyword via `units.ts` (e.g. `2 cans (15 oz)`).
  - Avoids hyphenated modifier strings like `"8-oz package"`.

### Q3. Density & Volume-to-Weight Unit Equivalences

- **Question:** Should culinary volume-to-weight unit equivalences be added to `item-rules.json` to enable package conversions from recipe volume measurements (cups/tbsp)?
- **Decision:** Yes, add standard culinary `unitEquivalences` in `item-rules.json` alongside package sizes in `us-grocery.json`.
- **Details:**
  - Allows recipes measured in cups (e.g. flour, sugar, yogurt, rice, grains) to be converted to retail package units (bags, tubs, cartons).
  - Use established culinary standard densities (e.g., 1 cup all-purpose flour = 4.25 oz, 1 cup granulated sugar = 7 oz, 1 cup Greek yogurt = 8 oz).

### Q4. Package Sizing Granularity (Multi-Tier vs Single Standard Size)

- **Question:** How should we decide between multi-tier package sizes versus single standard sizes in `us-grocery.json`?
- **Decision:** Support multi-tier sizes for ubiquitous household retail options (e.g., broths 16/32 oz; milk/cream 16/32/64 oz; shredded cheese 8/16 oz; rice 2/5 lb; canned tomatoes 15/28 oz) while using single canonical package sizes for specialty items (e.g. condensed milk 14 oz, panko 8 oz). Avoid single-serve snack sizes and warehouse bulk sizes.
- **Details:**
  - Allows `PackageMatcherStep` to pick smaller or larger containers based on required recipe quantity to minimize food waste.
  - Keeps package representations realistic for standard home kitchen grocery shopping.

### Q5. Pre-Packaged / Cured Meats vs Ground Meats

- **Question:** How should pre-packaged/cured meats and ground meats be handled in `us-grocery.json`?
- **Decision:** Add package sizes for cured and pre-packaged meats (bacon, sausages, hot dogs, chorizo), but keep ground meats (ground beef, pork, turkey) as raw weight (lbs).
- **Details:**
  - Pre-packaged meats: bacon (`package (16 oz)`), Italian sausage (`package (19 oz)`), hot dogs (`package (8 hot dogs)` / `package (16 oz)`), chorizo (`package (12 oz)`), cocktail wieners (`package (14 oz)`).
  - Ground meats: Keep as raw weight (e.g. 1.25 lbs) without package rounding, accommodating variable butcher tray weights (typically 1.0 to 1.5 lbs).

### Q6. Pantry Staples & Condiments Package Sizing

- **Question:** Should standard retail package sizes be defined for pantry staples, oils/vinegars, and condiments in `us-grocery.json`?
- **Decision:** Yes for Baking Staples, Oils & Vinegars, and Core Condiments. Omit individual spices & seasonings.
- **Details:**
  - Baking: Flours (`bag (5 lb)`), granulated sugar (`bag (4 lb)`), brown/powdered sugar (`bag (2 lb)`), baking soda (`box (16 oz)`), baking powder (`can (8.1 oz)`), cornstarch (`box (16 oz)`), vanilla extract (`bottle (2 fl oz)`).
  - Oils & Vinegars: Olive oil (`bottle (16.9 fl oz)`), vegetable oil (`bottle (48 fl oz)`), sesame oil (`bottle (5 fl oz)`), vinegars (`bottle (16 fl oz)`).
  - Condiments: Soy sauce (`bottle (15 fl oz)`), sriracha (`bottle (17 oz)`), honey (`bottle (12 oz)`), maple syrup (`bottle (12 fl oz)`), peanut butter (`jar (16 oz)`), Dijon mustard (`jar (8 oz)`), mayonnaise (`jar (30 oz)`).
  - Spices & seasonings: Left unmapped (no package sizing) so they remain as clean recipe measures.

## Open Questions

_(None remaining — all architectural branches resolved)_
