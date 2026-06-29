CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Protein', 'Vegetable', 'Carbohydrate', 'Other'))
);

CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  notes TEXT,
  tags TEXT -- JSON array stored as text
);

CREATE TABLE IF NOT EXISTS dish_ingredients (
  dish_id TEXT NOT NULL,
  ingredient_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('protein', 'vegetable', 'carbohydrate', 'other')),
  PRIMARY KEY (dish_id, ingredient_id),
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS meal_plans (
  week_start_date TEXT NOT NULL,
  day TEXT NOT NULL CHECK(day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
  dish_id TEXT,
  PRIMARY KEY (week_start_date, day),
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE SET NULL
);
