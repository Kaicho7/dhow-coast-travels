module.exports = function(eleventyConfig) {
  // Passthrough copy for static assets - copy contents of public to output root
  eleventyConfig.addPassthroughCopy({"public/css": "css"});
  eleventyConfig.addPassthroughCopy({"public/js": "js"});
  eleventyConfig.addPassthroughCopy({"public/images": "images"});
  
  // Load tours.json using fs
  const fs = require("fs");
  const path = require("path");
  let toursData = {};
  try {
    toursData = JSON.parse(fs.readFileSync(path.join("./", "_data", "tours.json"), "utf8"));
  } catch(e) {
    try {
      toursData = JSON.parse(fs.readFileSync(path.join("./src", "data", "tours.json"), "utf8"));
    } catch(e2) {
      toursData = {};
    }
  }
  
  // Map tour slug → existing image filename (keyword-scored heroes from SEO re-tag)
  const slugMap = {
    "stone-town-walking-tour": "mariola-grobelska-4DhGPppqcDE-unsplash.jpg",
    "stone-town-spice-prison-combo": "excursions.png",
    "spice-farm": "nutmeg-spice-farm-zanzibar.jpg",
    "village-community-tour": "zanzibar-market-scene-local-produce.jpg",
    "safari-blue": "zanzibar-traditional-wooden-boat-turquoise-water.jpg",
    "mnemba-snorkeling": "mnemba-atoll-snorkeling-green-sea-turtle.jpg",
    "prison-island-nakupenda": "prison-island-wooden-pier-boats-zanzibar.jpg",
    "nakupenda-sandbank": "nakupenda-sandbank-tour-zanzibar.jpg",
    "chumbe-island": "mnemba-atoll-snorkeling-tropical-fish-coral.jpg",
    "sunset-dhow-cruise": "zanzibar-nungwi-sunset-dhow-cruise-ocean.jpg",
    "kizimkazi-dolphin-tour": "kizimkazi-dolphin-watching-tour.jpg",
    "jozani-forest": "jozani-forest-red-colobus-monkeys.jpg",
    "kuza-cave-seaweed": "seaweed-farming-zanzibar-coast.jpg",
    "mikumi-nyerere-day-safari": "lukasz-lu8BMgAs64Q-unsplash.jpg",
    "serengeti-3day-flyin": "masai-giraffe-close-up-tanzania-safari.jpg",
    "zanzibar-essentials-3day": "packing-beach.jpg"
  };

  // Load all 6 metadata JSON files to build a filename→metadata lookup
  const metadataFiles = [
    "complete-image-metadata.json",
    "image-metadata.json",
    "personal-photo-metadata-updated.json",
    "personal-photo-metadata.json",
    "stock-photo-metadata-updated.json",
    "stock-photo-metadata.json"
  ];
  const metadataIndex = {};
  metadataFiles.forEach(metadataFile => {
    try {
      const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, "src", "data", metadataFile), "utf8"));
      const entries = Array.isArray(metadata) ? metadata : (metadata.images || metadata.metadata || []);
      entries.forEach(entry => {
        if (entry && entry.file) {
          metadataIndex[entry.file] = entry;
        }
      });
    } catch(e) {
      // Skip metadata files that can't be read
    }
  });

  // Intent map for page intents
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

  // Add global data
  eleventyConfig.addGlobalData("__slugMap", slugMap);
  eleventyConfig.addGlobalData("__intentMap", intentMap);
  eleventyConfig.addGlobalData("__metadataIndex", metadataIndex);

  // Helper function to normalize inputPath
  function normalizePath(inputPath) {
    if (!inputPath) return "";
    let p = inputPath;
    // Remove leading ./ or .\\
    if (p.startsWith("./")) p = p.slice(2);
    else if (p.startsWith(".\\")) p = p.slice(2);
    // Remove leading src/
    if (p.startsWith("src/")) p = p.slice(4);
    else if (p.startsWith("src\\")) p = p.slice(4);
    // Remove any leading path separators
    while (p.startsWith("/") || p.startsWith("\\")) {
      p = p.slice(1);
    }
    return p;
  }

  // Add filter to get featured image for a page
  eleventyConfig.addNunjucksFilter("featuredImage", function(inputPath) {
    let featuredImage = "default-tour-hero.jpg";
    let featuredAlt = "";

    const tourPath = normalizePath(inputPath);

    if (tourPath.startsWith("pages/tours/")) {
      const slug = tourPath.replace("pages/tours/", "").replace(/\.(njk|md)$/, "");
      const mapSlug = slugMap[slug];
      if (mapSlug && metadataIndex[mapSlug]) {
        featuredImage = mapSlug;
        featuredAlt = metadataIndex[mapSlug].alt_text || "";
      } else if (mapSlug) {
        featuredImage = mapSlug;
      }
    } else if (slugMap[tourPath]) {
      const mapSlug = slugMap[tourPath];
      if (metadataIndex[mapSlug]) {
        featuredImage = mapSlug;
        featuredAlt = metadataIndex[mapSlug].alt_text || "";
      } else {
        featuredImage = mapSlug;
      }
    }

    return { featuredImage, featuredAlt };
  });

  // Add filter to get intent for a page
  eleventyConfig.addNunjucksFilter("pageIntent", function(inputPath) {
    if (!inputPath) return intentMap.default;
    const tourPath = normalizePath(inputPath);
    return intentMap[tourPath] || intentMap.default;
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
