module.exports = function(eleventyConfig) {
  // Passthrough copy for static assets - copy contents of public to output root
  eleventyConfig.addPassthroughCopy({"public/css": "css"});
  eleventyConfig.addPassthroughCopy({"public/js": "js"});
  eleventyConfig.addPassthroughCopy({"public/images": "images"});
  // Load tours.json using fs (dir available later via getGlobals or in data extensions)
  const fs = require("fs");
  const path = require("path");
  let toursData = {};
  try {
    // Try _data directory first (Eleventy automatic data)
    toursData = JSON.parse(fs.readFileSync(path.join("./", "_data", "tours.json"), "utf8"));
  } catch(e) {
    // Fallback: read from src/data/tours.json
    try {
      toursData = JSON.parse(fs.readFileSync(path.join("./src", "data", "tours.json"), "utf8"));
    } catch(e2) {
      // If all else fails, empty object - featured_image will use defaults
      toursData = {};
    }
  }
  // Set global data with the featured image slug map
  // Map tour slug → existing image filename (matching tours.json featured_image values)
  const slugMap = {
    "stone-town-walking-tour": "stone-town-feature.jpg",
    "stone-town-spice-prison-combo": "stone-town-feature.jpg",
    "spice-farm": "spice-farm-sign.jpg",
    "village-community-tour": "chake-chake-town.jpg",
    "safari-blue": "mnemba-snorkeling.jpg",
    "mnemba-snorkeling": "mnemba-snorkeling.jpg",
    "prison-island-nakupenda": "migration-turtle.jpg",
    "nakupenda-sandbank": "mnemba-snorkeling.jpg",
    "chumbe-island": "mnemba-snorkeling.jpg",
    "sunset-dhow-cruise": "packing-beach.jpg",
    "kizimkazi-dolphin-tour": "kizimkazi-dolphin.jpg",
    "jozani-forest": "tribes-culture-dance.jpg",
    "kuza-cave-seaweed": "packing-beach.jpg",
    "mikumi-nyerere-day-safari": "self-drive-suv.jpg",
    "serengeti-3day-flyin": "self-drive-suv.jpg",
    "zanzibar-essentials-3day": "packing-beach.jpg"
  };
  // Make slugMap available as global data so data extensions can access it
  eleventyConfig.addGlobalData("__slugMap", slugMap);
  // Add data extension for problem page intents + featured image from tours.json
  eleventyConfig.addDataExtension("page", function(data, content) {
    const intentMap = {
      "family-travel": {problem: "safe beaches children turtle snorkeling spice farm kids", cta_text: "Message us on WhatsApp with children's ages and interests"},
      "honeymoon-packages": {problem: "romantic sunset dhow cruise private beach dinner", cta_text: "Message us on WhatsApp with preferred style and budget"},
      "self-drive": {problem: "rental car SUV 4x4 Stone Town east coast", cta_text: "Message us on WhatsApp with preferred vehicle type pickup date duration"},
      "migration-calendar": {problem: "turtle nesting whale watching dolphin bird migration", cta_text: "Message us on WhatsApp with preferred travel month"},
      "health-safety": {problem: "mosquito net repellent antimalarial safe swimming", cta_text: "Message us on WhatsApp with specific health concern"},
      "tribes-culture": {problem: "Swahili culture local tribes authentic traditions", cta_text: "Message us on WhatsApp for custom cultural itineraries"},
      "packing-guide": {problem: "essential packing list seasonal what NOT to bring", cta_text: "Message us on WhatsApp for personalized packing list"},
      "spice-farm-cultural": {problem: "spice trade history cloves vanilla nutmeg cinnamon", cta_text: "Message us on WhatsApp to arrange spice farm visit"},
      "default": {problem: "zanzibar travel planning", cta_text: "Message us on WhatsApp for customized itinerary"}
    };
    data.page.intent = intentMap[data.page.inputPath || "default"] || intentMap.default;

    // Map featured_image based on inputPath using the global slugMap
    const inputPath = data.page.inputPath || "";
    const slugMap = data.__slugMap || slugMap;
    if (inputPath.startsWith("pages/tours/")) {
      const slug = inputPath.replace("pages/tours/", "").replace(/\.(njk|md)$/, "");
      data.page.featured_image = slugMap[slug] || "default-tour-hero.jpg";
    } else if (slugMap[inputPath]) {
      data.page.featured_image = slugMap[inputPath] || "default-tour-hero.jpg";
    } else {
      data.page.featured_image = "default-tour-hero.jpg";
    }
    return data;
  });
  // Enable deep data merging
  eleventyConfig.setDataDeepMerge(true);
  // Add a filter for JSON stringification (useful for JSON‑LD)
  eleventyConfig.addNunjucksFilter("json", function(value) {
    return JSON.stringify(value);
  });
  // Add limit filter for arrays
  eleventyConfig.addNunjucksFilter("limit", function(arr, n) {
    if (!Array.isArray(arr)) return arr;
    return arr.slice(0, n);
  });
  // Add contains filter for strings/arrays
  eleventyConfig.addNunjucksFilter("contains", function(haystack, needle) {
    if (typeof haystack === 'string') {
      return haystack.includes(needle);
    }
    if (Array.isArray(haystack)) {
      return haystack.includes(needle);
    }
    return false;
  });
  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "data",
      output: "dist"
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};