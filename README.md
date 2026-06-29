# Meal Planner

A lightweight web app for planning weekday dinners. Minimizes user input and automatically generates a grocery list and protein summary.

## Getting Started

```bash
npm install
npm run dev
```

## Features

- **Ingredients**: Create and manage proteins and vegetables
- **Dishes**: Build dishes from ingredients (one primary protein + multiple vegetables)
- **Weekly Planner**: Drag-and-drop Mon–Fri dinner planner with copy previous week and duplicate meal
- **Grocery List**: Auto-generated from the current week's plan
- **Statistics**: Last cooked date and times cooked this year, derived automatically

## Tech Stack

React + TypeScript + Vite, localStorage for persistence, @dnd-kit for drag-and-drop.
