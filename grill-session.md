# Grill Session: Market Basket PNH Store Layout

## Closed Decisions

### Q1. Store Section Sequence & Missing Categories Placement

- **Question:** How should Market Basket PNH's sections be ordered and where do missing recipe categories map?
- **Decision:** Explicit 20-section sequence plus Section 99 (Other):
  - **1:** Left Wall (Cheese, Yogurt/Sour Cream/Ricotta, Butter/Biscuits/Dairy)
  - **2:** Deli & Seafood (Deli, Rotisserie Chicken, Fresh Seafood)
  - **3:** Aisle 1 (Frozen Meats, Breakfast Meats, Bacon & Eggs)
  - **4:** Aisle 2 (Cooking Oil, Vinegars & Specialty Oils, Asian & Hispanic Foods, Tortillas/Wraps/Pitas end-cap, Salad Dressings, Condiments, Pickles, Tuna Fish, Baked Beans, Ketchup, Salsa)
  - **5:** Aisle 3 (Cereal, Fruit Snacks, Organic Cereal, Oatmeal, Granola Bars, Rice Cakes, Raisins, Pop Tarts)
  - **6:** Aisle 4 (Pasta, Spaghetti Sauce, Tomato Paste, Mac n Cheese, Ramen Noodles, Soup, Broths, Rice)
  - **7:** Aisle 5 (Coffee, Tea, Cocoa, Evaporated Milk, Spices, Flour & Sugar, Baking Needs, Jello & Pudding)
  - **8:** Aisle 6 (Apple Juice, Cranberry Juice, Gatorade, Vegetable Juice, Dried Beans, Can Vegetables, Kool Aid, Gravy)
  - **9:** Aisle 7 (Applesauce, Natural Chips, Candy, Can Fruit, Coke, Pepsi, Soda)
  - **10:** Back Wall (Breakfast Meats, Sausage, Lamb, Ground Beef, Ground Turkey, Ground Pork, Beef Cuts, Chicken)
  - **11:** Aisle 8 (Hair Care, Health Care, Vitamins, Energy Bars, Dental Care, Baby Care, Batteries, Lightbulbs)
  - **12:** Aisle 9 (Paper Towels, Paper Plates, Automotive, Laundry Basket, Facial Tissue, Bath Tissue, Dinner Napkins, Stationary)
  - **13:** Aisle 10 (Bleach, Fabric Softener, Laundry Detergent, Candles, Dish Detergent, Household Cleaners, Air Fresheners, Brooms & Mops)
  - **14:** Aisle 11 (Dog food, Cat food, Pet needs, Foils & wraps, Food storage, Cat litter, Storage containers)
  - **15:** Aisle 12 (Sparkling water, Bottled water, Iced coffee, Seltzer water, Flavored water, Gallon water, Iced tea)
  - **16:** Aisle 13 (Imported alcohol, Snacks, Champagne, Wine, Cheese puffs, Domestic alcohol)
  - **17:** Aisle 14 (Bread, Rolls, Peanut butter, Jams & jellies, Cookies, Crackers, Oyster crackers, Saltines)
  - **18:** Aisle 15 (Frozen pizza, Frozen fish, Frozen pot pies, Imported cookies, Frozen vegetables, Frozen entrees, Frozen pasta, French fries)
  - **19:** Aisle 16 (Produce, Fresh produce & herbs, Tofu/Plant-based, Cooking & baking nuts, Floral, Ice cream, Frozen juice, Frozen waffles, Frozen bagels, Frozen desserts, Popcorn & peanuts)
  - **20:** Bakery & Front Checkout (Bakery, Front Checkout Ice)
  - **99:** Other / Uncategorized

### Q2. Category-to-Section Mapping Engine & Schema

- **Question:** How should categories be mapped to sections for Market Basket PNH?
- **Decision:** Keep category-to-section routing clean and simple. Map `ItemCategory` values directly into the `categories` array of the 20 Market Basket PNH `StoreSection` definitions.

### Q3 & Q4. Schema Expansion & Complete Category Allocation

- **Question:** Should new `ItemCategory` values be defined, and how do categories map to Market Basket PNH sections?
- **Decision:** Define 6 new `ItemCategory` values: `cereal-breakfast`, `coffee-tea`, `canned-fruit`, `household-paper`, `alcohol`, `bread-spreads`. Map all 29 categories into Market Basket PNH's 20 sections as follows:
  - **Section 1 (Left Wall):** `milk-cream`, `butter-cheese`, `eggs`
  - **Section 2 (Deli & Seafood):** `deli`, `seafood`
  - **Section 3 (Aisle 1):** _(Frozen breakfast meats / specialty)_
  - **Section 4 (Aisle 2):** `condiments`, `oils-vinegars`
  - **Section 5 (Aisle 3):** `cereal-breakfast`
  - **Section 6 (Aisle 4):** `pasta-grains`, `canned-tomatoes`
  - **Section 7 (Aisle 5):** `baking`, `spices-seasonings`, `coffee-tea`
  - **Section 8 (Aisle 6):** `canned-beans`, `canned-other`
  - **Section 9 (Aisle 7):** `canned-fruit`, `snacks`
  - **Section 10 (Back Wall):** `meat`, `poultry`
  - **Section 11 (Aisle 8):** `household-paper` _(health/wellness)_
  - **Section 12 (Aisle 9):** `household-paper` _(paper goods)_
  - **Section 13 (Aisle 10):** `household-paper` _(cleaning)_
  - **Section 14 (Aisle 11):** `household-paper` _(pet/storage/foils)_
  - **Section 15 (Aisle 12):** `beverages` _(water/seltzer)_
  - **Section 16 (Aisle 13):** `alcohol`
  - **Section 17 (Aisle 14):** `bread-spreads`
  - **Section 18 (Aisle 15):** `frozen`
  - **Section 19 (Aisle 16):** `fresh-produce`, `fresh-herbs`, `tofu-tempeh`
  - **Section 20 (Bakery & Front):** `bakery`
  - **Section 99 (Other):** `other`
  - _Backward compatibility:_ Update `STANDARD_SECTIONS` so the 6 new categories fall into `bakery`/`pasta-grains`/`beverages`/`canned-other`/`other`.

### Q5. Store Layout Metadata & Default Store Selection

- **Question:** What ID, display label, description, and default layout preference should be set?
- **Decision:**
  - **ID:** `market-basket-pnh`
  - **Name:** `Market Basket PNH`
  - **Description:** `Market Basket in Portsmouth NH`
  - **Default:** `market-basket-pnh` is now the primary and default store layout project-wide (placed first in `STORE_LAYOUTS` and returned by default in `getActiveStoreLayoutId()`).

## Open Questions

_(None — Design grilling complete! Ready for implementation.)_
