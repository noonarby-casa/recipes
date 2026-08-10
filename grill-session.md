# Grill Session: Shopping List Ingredient Normalization & Merging Rules

## Closed Decisions

### Q1. Onion Specifiers & Variant Separation

- **Question:** Should plain "onion" automatically alias/canonicalize to "yellow onion", while keeping distinct varieties (red onion, white onion, sweet onion) as separate canonical items?
- **Decision:** Split onions into multiple canonical rules. Plain "onion" defaults to "yellow onion" (canonicalName: "yellow onion" with "onion" as alias). "red onion", "white onion", and "sweet onion" become distinct canonical items.
- **Details:**
  - "onion" & "yellow onion" merge into "yellow onion".
  - "red onion" remains a separate item on the shopping list.
  - "white onion" remains a separate item.
  - "sweet onion" remains a separate item.

### Q2. Bell Pepper Variants & Default Grouping

- **Question:** Should color-specific bell peppers (red, green, yellow bell pepper) remain separate canonical items while generic "bell pepper" acts as an alias or separate item?
- **Decision:** Split bell peppers by color into separate canonical items ("red bell pepper", "green bell pepper", "yellow bell pepper"). Maintain plain "bell pepper" as a generic canonical fallback item.
- **Details:**
  - "red bell pepper" remains separate.
  - "green bell pepper" remains separate.
  - "yellow bell pepper" remains separate.
  - Unspecified "bell pepper" remains generic.

### Q3. Fresh vs. Dried Herbs

- **Question:** Should fresh herbs (e.g., "fresh basil", "fresh thyme") be kept distinct from their dried spice aisle counterparts ("dried basil", "dried thyme")?
- **Decision:** Separate fresh herbs from dried herbs into distinct produce vs. spice canonical items.
- **Details:**
  - Plain herb names (e.g. "thyme", "oregano", "parsley", "sage") alias to **dried** herbs by default (`spices-baking` aisle).
  - Exception: Plain **"basil"** aliases to **fresh basil** (`fresh-produce` aisle).
  - Explicit "fresh" or "dried" prefixes dictate the exact category/item.

### Q4. Stock & Broth Types / Sodium Content

- **Question:** How should broth vs. stock and low-sodium variants be merged (e.g., "chicken broth" vs "low-sodium chicken broth" vs "chicken stock" vs "vegetable broth")?
- **Decision:** Separate broth/stock by protein/base type, merge broth & stock for the same protein, and alias low-sodium to standard broth.
- **Details:**
  - `chicken broth` & `chicken stock` merge into `chicken broth`.
  - `vegetable broth` & `vegetable stock` merge into `vegetable broth`.
  - `beef broth` & `beef stock` merge into `beef broth`.
  - `low-sodium` versions alias to their respective base broth item.

### Q5. Oil & Vinegar Varieties

- **Question:** How should specialty oils (sesame oil, coconut oil, avocado oil) and vinegars (apple cider vinegar, red wine vinegar, rice vinegar, white vinegar) be handled?
- **Decision:** Separate specialty oils and distinct vinegar varieties into individual canonical items.
- **Details:**
  - `olive oil` & `extra virgin olive oil` merge into `olive oil`.
  - `canola oil` & `vegetable oil` merge into `vegetable oil`.
  - `sesame oil`, `coconut oil`, and `avocado oil` become separate canonical items.
  - `apple cider vinegar`, `red wine vinegar`, `rice vinegar`, `white vinegar`, and `balsamic vinegar` become separate canonical items.

### Q6. Cheese Forms & Varieties

- **Question:** How should generic terms ("cheese", "sliced cheese"), block vs shredded cheese, and sharp vs mild cheddar be handled?
- **Decision:** Clean up generic cheese aliases, separate fresh mozzarella, and maintain cheddar grouping.
- **Details:**
  - Remove `"cheese"` and `"sliced cheese"` from `mozzarella ball`.
  - Separate `fresh mozzarella / mozzarella ball` from standard `mozzarella`.
  - Merge `sharp cheddar`, `white cheddar`, and `mild cheddar` into `cheddar cheese`.

### Q7. Sugar & Flour Varieties

- **Question:** How should baking sugars (brown sugar, powdered/confectioners sugar, granulated sugar) and flours (all-purpose, cake flour, bread flour) be handled?
- **Decision:** Fix powdered sugar separation and separate specialty flours.
- **Details:**
  - Separate `powdered sugar` / `confectioners' sugar` from brown sugar into its own item.
  - Alias plain `"sugar"` and `"granulated sugar"` to `granulated sugar`.
  - Alias plain `"flour"` and `"all-purpose flour"` to `all-purpose flour`.
  - Keep `cake flour`, `bread flour`, and `whole wheat flour` as separate canonical items.

### Q8. Garlic Forms

- **Question:** Should fresh garlic cloves vs garlic powder vs jarred minced garlic be kept distinct or merged?
- **Decision:** Keep fresh garlic, garlic powder, and jarred minced garlic as three distinct canonical items.
- **Details:**
  - Fresh `garlic` (cloves/heads) stays in `fresh-produce`.
  - `garlic powder` stays in `spices-baking`.
  - `minced garlic` (jarred) becomes a separate canonical item.

### Q9. Implementation Strategy & Next Steps

- **Question:** Shall we now update `item-rules.json` and unit test suites with all agreed decisions, and execute `pnpm run ci` to verify?
- **Decision:** Proceed with implementation in `item-rules.json`, add/update unit tests, and verify via `pnpm run ci`.

## Open Questions

_(All questions resolved)_
