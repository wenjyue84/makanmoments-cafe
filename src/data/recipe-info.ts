export interface RecipeInfo {
  ingredients: string[];
  preparation: string;
}

// Key: dish name pattern used for partial matching against MenuItem.nameEn
export const recipeData: Record<string, RecipeInfo> = {
  "Nasi Lemak": {
    ingredients: [
      "Coconut milk",
      "Pandan leaves",
      "Lemongrass",
      "Fresh ginger",
      "Red shallots",
      "Cinnamon stick",
      "Cardamom",
      "Star anise",
      "Cloves",
      "Butter",
    ],
    preparation:
      "Our nasi lemak rice is slow-cooked with fresh coconut milk, fragrant pandan leaves, and warm spices — giving it that signature rich, creamy aroma. Served with your choice of sambal, egg, and sides.",
  },
  "Ayam Penyet": {
    ingredients: [
      "Marinated fried chicken",
      "Sambal chili",
      "Chili padi",
      "Red shallots",
      "Garlic",
      "Tomatoes",
      "Gula Melaka (palm sugar)",
      "Belacan (shrimp paste)",
      "Cucumber",
      "Fresh vegetables",
    ],
    preparation:
      "Our ayam penyet features crispy smashed chicken paired with house-made sambal — available in red chili (spicy & tangy) or green chili (fresh & herbal). Served with fresh cucumber and vegetables.",
  },
  "Rendang": {
    ingredients: [
      "Chicken",
      "Lemongrass",
      "Galangal",
      "Ginger",
      "Red shallots",
      "Garlic",
      "Dried chili",
      "Fresh turmeric",
      "Kerisik (toasted coconut paste)",
      "Gula Melaka (palm sugar)",
      "Coconut milk",
      "Kaffir lime leaves",
      "Tamarind",
    ],
    preparation:
      "Our rendang is slow-cooked until the coconut milk caramelises into a rich, dry coating over tender chicken — fragrant with galangal, lemongrass, and toasted coconut paste.",
  },
  "Mee Siam": {
    ingredients: [
      "Rice vermicelli",
      "Spice paste (rempah)",
      "Fresh prawns",
      "Dried shrimp",
      "Chili paste",
      "Coconut milk rice",
      "Pandan leaves",
      "Lemongrass",
      "Ginger",
      "Red shallots",
    ],
    preparation:
      "Our mee siam features thin rice vermicelli tossed in a tangy-spicy rempah paste with dried shrimp and fresh prawns, served alongside our fragrant coconut rice.",
  },
  "Curry Mee": {
    ingredients: [
      "Chicken bone & fish bone broth",
      "Curry paste",
      "Thick coconut milk",
      "Curry leaves",
      "Lemongrass",
      "Fried tofu puffs",
      "Dried tofu skin",
      "Curry chicken",
      "Bean sprouts",
      "Rice vermicelli",
      "Anchovies",
      "Galangal",
    ],
    preparation:
      "Our curry mee is built on a rich broth simmered with chicken bones, fish bones, and anchovies for over an hour, blended with curry paste and finished with thick coconut milk.",
  },
  "Tom Yum": {
    ingredients: [
      "Lemongrass",
      "Galangal",
      "Kaffir lime leaves",
      "Fresh lime juice",
      "Fish sauce",
      "Chili",
      "Evaporated milk",
      "Mushrooms",
      "Tomatoes",
      "Fresh vegetables",
    ],
    preparation:
      "Our tom yum is a light, aromatic broth balanced with the sourness of lime, the warmth of lemongrass and galangal, and a subtle creaminess from evaporated milk.",
  },
  "Chicken Wing": {
    ingredients: [
      "Chicken wings",
      "Fish sauce",
      "Corn starch",
      "Tapioca starch",
      "Egg",
    ],
    preparation:
      "Our fried chicken wings are marinated in fish sauce and coated in a crispy mixed-starch batter, then deep-fried at controlled heat for a golden, crunchy finish.",
  },
  "Curry Chicken": {
    ingredients: [
      "Chicken",
      "Lemongrass",
      "Ginger",
      "Galangal",
      "Red shallots",
      "Garlic",
      "Dried chili",
      "Fresh turmeric",
      "Kerisik (toasted coconut paste)",
      "Gula Melaka (palm sugar)",
      "Coconut milk",
      "Bay leaves",
      "Star anise",
      "Kaffir lime leaves",
    ],
    preparation:
      "Our curry chicken uses a hand-blended spice paste cooked down with fragrant aromatics, finished with coconut milk and toasted coconut paste for a rich, layered flavour.",
  },
  "Soya Sauce Noodle": {
    ingredients: [
      "Yellow noodles",
      "Fish sauce",
      "Light soy sauce",
      "Sweet soy sauce",
      "Dark soy sauce",
      "Oyster sauce",
      "Sesame oil",
      "Chicken broth",
      "Spring onions",
    ],
    preparation:
      "Our dry tossed noodles are coated in a house-made five-sauce blend — soy, sweet soy, dark soy, oyster, and fish sauce — finished with sesame oil and a splash of broth.",
  },
  "Daily Soup": {
    ingredients: [
      "Old cucumber",
      "Dried squid",
      "Red dates",
      "Honey dates",
      "Chicken bone",
      "Goji berries",
    ],
    preparation:
      "Our daily soup is slowly simmered with old cucumber, chicken bones, dried squid, red and honey dates, and goji berries — naturally sweet and nourishing.",
  },
  "Corn Cup": {
    ingredients: [
      "Sweet corn",
      "Condensed milk",
      "Margarine",
      "Salt",
    ],
    preparation:
      "Warm sweet corn kernels tossed with condensed milk, a touch of margarine, and a pinch of salt — a simple, comforting street snack served in a cup.",
  },
  "Egg Waffle": {
    ingredients: [
      "Egg waffle batter",
      "Margarine",
    ],
    preparation:
      "Our egg waffles are freshly poured into a preheated honeycomb mould and baked at 160°C until golden and crispy on the outside, soft and airy inside.",
  },
  "Banana Fritter": {
    ingredients: [
      "Banana",
      "Rice flour",
      "Wheat flour",
      "Corn starch",
      "Turmeric powder",
      "Black sesame",
      "Egg",
      "Baking powder",
    ],
    preparation:
      "Ripe bananas are dipped in a seasoned batter of rice flour, wheat flour, and turmeric, then deep-fried to a golden crisp — fragrant, light, and satisfying.",
  },
  "Pisang": {
    ingredients: [
      "Banana",
      "Rice flour",
      "Wheat flour",
      "Corn starch",
      "Turmeric powder",
      "Black sesame",
      "Egg",
      "Baking powder",
    ],
    preparation:
      "Ripe bananas are dipped in a seasoned batter of rice flour, wheat flour, and turmeric, then deep-fried to a golden crisp — fragrant, light, and satisfying.",
  },
  "Apam": {
    ingredients: [
      "Wheat flour",
      "Corn starch",
      "Rice flour",
      "Egg",
      "Milk",
      "Sugar",
      "Baking powder",
      "Soda powder",
    ],
    preparation:
      "Our apam is made from a freshly mixed flour batter cooked in traditional moulds — soft, fluffy pancake-style bites that pair perfectly with sweet or savoury toppings.",
  },
};

/**
 * Look up recipe info by MenuItem.nameEn.
 * 1. Exact match
 * 2. Partial match — recipe key contained in dish name, or vice versa
 * Returns null if no recipe data exists.
 */
export function getRecipeInfo(nameEn: string): RecipeInfo | null {
  if (recipeData[nameEn]) return recipeData[nameEn];
  const norm = nameEn.toLowerCase();
  for (const [key, val] of Object.entries(recipeData)) {
    const k = key.toLowerCase();
    if (norm.includes(k) || k.includes(norm)) {
      return val;
    }
  }
  return null;
}
