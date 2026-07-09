# Shortening the 'x' URL Parameter Design

This document describes the design and encoding scheme used for the `x` URL parameter in the Noonarby Casa Recipes meal planner. The parameter is used to encode custom recipes and extra ingredient metadata.

## Finalized Design

### 1. Parameter Separation

- **Strategy**: The skeletal meal plan schedule is kept in `p` and custom text/ingredients are kept in `x`.
- **Reasoning**: This keeps standard plans extremely short by omitting `x` entirely if there are no custom recipes or extras.

### 2. Single Parameter `x`

- **Strategy**: All custom entries are packed into a single `x` parameter.
- **Reasoning**: Saves URL bytes by avoiding repeated `&x=` query keys and avoiding separate Base64 block padding overhead on multiple small strings.

### 3. Delimiter Scheme: Two-Delimiter Positional

- **Strategy**: Use a Two-Delimiter Positional structure with `~` and `|`.
  - `~` (tilde) separates multiple custom entries: `[entry1]~[entry2]`
  - `|` (pipe) separates all fields/ingredients inside an entry positionally: `index|title|ing1|ing2`
- **Positional Rules**:
  - `parts[0]` = `index` in `planState` (integer)
  - `parts[1]` = `title` (optional; empty string `""` represents no title)
  - `parts[2..]` = list of `extraIngredients`
- **Field Omission**:
  - If only a title is present: `index|title` (omit the trailing ingredients).
  - If only ingredients are present: `index||ing1|ing2` (keep the second empty field for title).
  - If both are present: `index|title|ing1|ing2`
- **Collision Prevention**:
  - User-typed characters like decimals (`1.5`), abbreviations (`tbsp.`), and commas (`,`) are preserved perfectly.
  - Any user-input `~` is sanitized to `-` and `|` is sanitized to a space during encoding.

### 4. Encoding Scheme: Base64URL

- **Strategy**: Base64URL encoding with no compression.
- **Reasoning**: Ensures robust handling of unicode characters (fractions like `½`, `¼`, accents like `é`) and guarantees full URL safety. Compression is omitted because small custom payloads (1-3 items) are too small to benefit from it.

---

## Example Serializations

1.  **Title + Ingredients**:
    - **Data**: Index `0`, Custom Title `"Custom Salad"`, Ingredients `["1 cup spinach", "3 cherry tomatoes"]`
    - **Plain text**: `0|Custom Salad|1 cup spinach|3 cherry tomatoes`
    - **Base64URL**: `MHxDdXN0b20gU2FsYWR8MSBjdXAgc3BpbmFjaHwzIGNoZXJyeSB0b21hdG9lcw`

2.  **Title Only**:
    - **Data**: Index `0`, Custom Title `"Custom Salad"`, Ingredients `[]`
    - **Plain text**: `0|Custom Salad`
    - **Base64URL**: `MHxDdXN0b20gU2FsYWQ`

3.  **Ingredients Only**:
    - **Data**: Index `0`, Custom Title `""`, Ingredients `["1 cup spinach"]`
    - **Plain text**: `0||1 cup spinach`
    - **Base64URL**: `MHx8MSBjdXAgc3BpbmFjaA`
