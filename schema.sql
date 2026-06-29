DROP TABLE IF EXISTS meal_plans;
DROP TABLE IF EXISTS dish_ingredients;
DROP TABLE IF EXISTS dishes;
DROP TABLE IF EXISTS ingredients;

CREATE TABLE ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Protein', 'Vegetable', 'Carbohydrate', 'Other'))
);

CREATE TABLE dishes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  notes TEXT,
  tags TEXT
);

CREATE TABLE dish_ingredients (
  dish_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('protein', 'vegetable', 'carbohydrate', 'other')),
  PRIMARY KEY (dish_id, ingredient_id),
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE meal_plans (
  week_start_date TEXT NOT NULL,
  day TEXT NOT NULL CHECK(day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
  dish_id INTEGER,
  PRIMARY KEY (week_start_date, day),
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE SET NULL
);
