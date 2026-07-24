# Grill Session: Custom Recipe Icon Selector Display & Layout

## Closed Decisions

### Q1. Core Requirement & Layout

- **Question:** What is the primary visual constraint for the icon picker in modals?
- **Decision:** The user MUST be able to see all icon choices cleanly without scrollbars in small dropdown containers or modal boundary clipping.

### Q2. Architecture & Overflow Prevention

- **Question:** How should the icon picker be rendered to guarantee zero scrollbars and zero modal boundary clipping?
- **Decision:** Implemented a **Viewport-Fixed Searchable Emoji Sheet Overlay (`position: fixed; z-index: 2000`)**.

### Q3. Sheet Features

- **Question:** What features does the Searchable Emoji Sheet provide?
- **Decision:**
  1.  **Real-Time Search Bar:** Instantly filters icons by typing (e.g. "tacos", "coffee", "cake").
  2.  **Category Filter Tabs:** `All (18)`, `Mains`, `Sides`, `Bakery`, `Drinks`, `Desserts`.
  3.  **6-Column Grid:** All 18 icons fit comfortably in 3 rows with ZERO scrollbars.
  4.  **Full Boundary Safety:** `position: fixed` overlay layer renders above all parent modals (`z-index: 2000`), guaranteeing 0 clipping and 0 parent scrollbars.

## Open Questions

_(All questions resolved!)_
