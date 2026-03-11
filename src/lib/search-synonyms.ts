/**
 * Semantic synonym map for Thai-Malaysian cafe menu search.
 *
 * Maps common English/Malay/Thai terms to their local equivalents so that
 * searching "ice coffee" also finds "Ice Kopi", "chicken" finds "Ayam", etc.
 *
 * Format: [term, synonyms[]] — all lowercase.
 */
const RAW_SYNONYMS: [string, string[]][] = [
  // ── Coffee ─────────────────────────────────────────────────────────────────
  ["coffee", ["kopi", "kopi-c", "kopi-o", "cham"]],
  ["kopi", ["coffee"]],
  ["kopi o", ["black coffee", "coffee"]],
  ["kopi c", ["coffee"]],
  ["black coffee", ["kopi o", "kopi-o"]],
  ["white coffee", ["kopi", "kopi-c", "kopi susu"]],
  ["iced coffee", ["ice kopi", "ice coffee"]],
  ["ice coffee", ["ice kopi", "kopi", "iced coffee"]],

  // ── Tea ────────────────────────────────────────────────────────────────────
  ["tea", ["teh", "teh-c", "teh-o"]],
  ["teh", ["tea"]],
  ["teh o", ["black tea", "tea"]],
  ["teh c", ["tea"]],
  ["iced tea", ["ice teh"]],
  ["ice tea", ["ice teh", "teh"]],
  ["lemon tea", ["teh limau", "ice lemon tea"]],
  ["milk tea", ["teh susu", "teh-c", "teh c"]],

  // ── Cham (coffee+tea mix) ──────────────────────────────────────────────────
  ["cham", ["coffee tea", "mix"]],

  // ── Milo ──────────────────────────────────────────────────────────────────
  ["chocolate milk", ["milo"]],
  ["cocoa", ["milo", "coklat"]],
  ["coklat", ["chocolate", "milo"]],
  ["chocolate", ["coklat", "milo"]],

  // ── Rice ───────────────────────────────────────────────────────────────────
  ["rice", ["nasi"]],
  ["nasi", ["rice"]],
  ["fried rice", ["nasi goreng"]],
  ["nasi goreng", ["fried rice"]],
  ["white rice", ["nasi putih"]],
  ["nasi lemak", ["coconut rice", "rice"]],
  ["coconut rice", ["nasi lemak"]],

  // ── Noodles ────────────────────────────────────────────────────────────────
  ["noodle", ["mee", "mi", "bee hoon", "vermicelli"]],
  ["noodles", ["mee", "mi", "bee hoon"]],
  ["mee", ["noodle", "noodles"]],
  ["bee hoon", ["rice vermicelli", "vermicelli", "noodle"]],
  ["vermicelli", ["bee hoon", "mee siam"]],
  ["mee siam", ["rice noodle", "bee hoon"]],

  // ── Chicken ────────────────────────────────────────────────────────────────
  ["chicken", ["ayam"]],
  ["ayam", ["chicken"]],
  ["fried chicken", ["ayam goreng"]],
  ["ayam goreng", ["fried chicken"]],
  ["ayam penyet", ["smashed chicken", "chicken"]],
  ["smashed chicken", ["ayam penyet"]],

  // ── Beef ───────────────────────────────────────────────────────────────────
  ["beef", ["daging", "lembu", "gyu"]],
  ["daging", ["beef"]],
  ["gyu", ["beef", "gyudon"]],
  ["gyudon", ["beef rice", "beef bowl", "gyu don"]],
  ["gyu don", ["beef rice", "beef bowl", "gyudon"]],

  // ── Fish ───────────────────────────────────────────────────────────────────
  ["fish", ["ikan", "siakap"]],
  ["ikan", ["fish"]],
  ["siakap", ["seabass", "fish"]],
  ["seabass", ["siakap", "fish"]],

  // ── Prawn / Shrimp ─────────────────────────────────────────────────────────
  ["prawn", ["udang", "shrimp"]],
  ["shrimp", ["udang", "prawn"]],
  ["udang", ["prawn", "shrimp"]],

  // ── Squid ──────────────────────────────────────────────────────────────────
  ["squid", ["sotong", "calamari"]],
  ["sotong", ["squid"]],
  ["calamari", ["sotong", "squid"]],

  // ── Vegetables ─────────────────────────────────────────────────────────────
  ["vegetable", ["sayur", "vegetables"]],
  ["vegetables", ["sayur"]],
  ["sayur", ["vegetable", "vegetables"]],
  ["kangkung", ["water spinach", "morning glory"]],
  ["water spinach", ["kangkung"]],
  ["morning glory", ["kangkung"]],
  ["tofu", ["tahu", "bean curd", "beancurd", "tau fu"]],
  ["tahu", ["tofu", "bean curd"]],
  ["bean curd", ["tofu", "tahu"]],
  ["okra", ["lady finger", "bendi"]],
  ["lady finger", ["okra"]],
  ["mushroom", ["cendawan"]],
  ["bean sprout", ["taugeh"]],
  ["taugeh", ["bean sprout"]],
  ["choy sum", ["choi sum", "vegetable"]],
  ["long bean", ["kacang panjang", "string bean"]],
  ["kacang panjang", ["long bean"]],

  // ── Egg ────────────────────────────────────────────────────────────────────
  ["egg", ["telur", "omelette"]],
  ["telur", ["egg"]],
  ["omelette", ["telur", "egg"]],
  ["omelet", ["telur", "omelette", "egg"]],

  // ── Soup ───────────────────────────────────────────────────────────────────
  ["soup", ["sup", "tomyum", "curry soup"]],
  ["sup", ["soup"]],
  ["tomyum", ["tom yum", "tom yam"]],
  ["tom yum", ["tomyum", "tom yam"]],
  ["tom yam", ["tomyum", "tom yum"]],

  // ── Cooking style ──────────────────────────────────────────────────────────
  ["fried", ["goreng"]],
  ["goreng", ["fried", "stir fried"]],
  ["stir fried", ["goreng"]],
  ["grilled", ["bakar"]],
  ["bakar", ["grilled", "bbq", "barbecue"]],
  ["steamed", ["kukus", "stim"]],
  ["kukus", ["steamed"]],

  // ── Curry ──────────────────────────────────────────────────────────────────
  ["curry", ["kari", "gulai", "green curry", "nanyang curry", "thai curry"]],
  ["kari", ["curry"]],
  ["green curry", ["thai curry", "kaeng khiao wan", "curry"]],

  // ── Hot / Cold ─────────────────────────────────────────────────────────────
  ["cold", ["ice", "iced", "ais", "sejuk"]],
  ["iced", ["ice", "cold", "ais"]],
  ["ice", ["iced", "cold", "ais"]],
  ["ais", ["ice", "iced", "cold"]],
  ["hot", ["panas", "warm"]],
  ["panas", ["hot", "warm"]],

  // ── Flavour ────────────────────────────────────────────────────────────────
  ["spicy", ["pedas", "chilli", "chili", "sambal"]],
  ["pedas", ["spicy"]],
  ["sambal", ["chilli sauce", "spicy sauce"]],
  ["sweet", ["manis"]],
  ["manis", ["sweet"]],
  ["sour", ["masam", "asam"]],
  ["masam", ["sour"]],
  ["salty", ["masin"]],
  ["masin", ["salty"]],
  ["salted", ["masin", "salty"]],
  ["salted egg", ["telur masin", "golden egg"]],

  // ── Set meals ──────────────────────────────────────────────────────────────
  ["set", ["combo", "set meal", "meal"]],
  ["combo", ["set", "meal"]],
  ["fish set", ["seafood set", "ikan set"]],
  ["seafood", ["ikan", "sotong", "udang", "prawn", "fish", "squid"]],

  // ── Drinks ─────────────────────────────────────────────────────────────────
  ["juice", ["jus", "fresh"]],
  ["lemon", ["limau"]],
  ["limau", ["lemon", "lime", "citrus"]],
  ["lime", ["limau"]],
  ["bandung", ["rose syrup", "milk", "pink drink"]],
  ["herbal", ["herba", "traditional"]],
  ["ginger", ["halia", "jahe"]],
  ["halia", ["ginger"]],
  ["honey", ["madu"]],
  ["madu", ["honey"]],
  ["water", ["air", "plain"]],
  ["plain water", ["air kosong"]],

  // ── Dessert ────────────────────────────────────────────────────────────────
  ["dessert", ["pencuci mulut", "bubur", "kuih"]],
  ["bubur", ["porridge", "pudding", "dessert"]],
  ["bubur cha cha", ["dessert", "coconut milk dessert"]],
  ["jelly", ["agar", "cincau"]],
  ["herbal jelly", ["gui lin gao", "cincau"]],

  // ── Misc ───────────────────────────────────────────────────────────────────
  ["pineapple", ["nanas"]],
  ["nanas", ["pineapple"]],
  ["kampung", ["village", "traditional"]],
  ["butter", ["mentega"]],
  ["buttermilk", ["butter milk", "milk butter"]],
  ["claypot", ["clay pot", "earthen pot"]],
  ["takeaway", ["take away", "tapau", "dabao", "bungkus"]],
  ["tapau", ["takeaway", "to go"]],
];

/** Build a lookup map (term → synonyms[]), all lowercase. */
const SYNONYM_MAP = new Map<string, string[]>();
for (const [term, synonyms] of RAW_SYNONYMS) {
  SYNONYM_MAP.set(term.toLowerCase(), synonyms.map((s) => s.toLowerCase()));
}

/**
 * Expands a search query by substituting each token with its synonyms.
 *
 * Returns the original query plus one alternate query per synonym substitution.
 * Deduplicates so the same string is never searched twice.
 *
 * Example:
 *   expandSearchQuery("ice coffee")
 *   → ["ice coffee", "ais coffee", "iced coffee", "cold coffee",
 *      "ice kopi", "ice kopi-c", "ice kopi-o", "ice cham"]
 */
export function expandSearchQuery(query: string): string[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [query];

  const queries = new Set<string>([normalized]);
  const tokens = normalized.split(/\s+/);

  // Single-token substitution: replace each individual token with its synonyms
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const synonyms = SYNONYM_MAP.get(token);
    if (synonyms) {
      for (const syn of synonyms) {
        const newTokens = [...tokens];
        newTokens[i] = syn;
        queries.add(newTokens.join(" "));
      }
    }
  }

  // Multi-word phrase substitution: match phrases like "ice coffee", "tom yum"
  for (const [phrase, synonyms] of SYNONYM_MAP.entries()) {
    if (phrase.includes(" ") && normalized.includes(phrase)) {
      for (const syn of synonyms) {
        queries.add(normalized.replace(phrase, syn));
      }
    }
  }

  return Array.from(queries);
}
