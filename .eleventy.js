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
    "zanzibar-essentials-3day": "packing-beach.jpg",
    "zanzibar-essentials-3-day-pass": "packing-beach.jpg"
  };

  // Map area zone name → existing image filename (for /areas/ cards and zone pages)
  const zoneImage = {
    "Stone Town": "mariola-grobelska-4DhGPppqcDE-unsplash.jpg",
    "Nungwi": "nungwi-beach-children-swimming-traditional-dhow-boats.jpg",
    "Kendwa": "zanzibar-kendwa-beach-aerial-dhow-kayak.jpg",
    "Paje": "paje-beach-zanzibar-kitesurfing-indian-ocean.jpg",
    "Jambiani": "zanzibar-jambiani-beach-village-life-women.jpg",
    "Kiwengwa": "zanzibar-island-resort-pier-boats.jpg",
    "Pongwe / Michamvi": "michamvi-rock-restaurant-beach.jpg",
    "Bwejuu / Dongwe": "zanzibar-jambiani-beach-low-tide-local-children.jpg",
    "Michamvi / Pingwe": "the-rock-restaurant-michamvi-pingwe-zanzibar.jpg",
    "Kizimkazi / Dimbani": "kizimkazi-zanzibar-dolphins-jumping-indian-ocean.jpg",
    "Fumba / Mbweni": "zanzibar-fumba-beach-aerial-view-turquoise-water.jpg",
    "Matemwe / Kigomani": "zanzibar-local-snorkeling-mnemba-atoll-matemwe.jpg",
    "Chake Chake (Pemba)": "chake-chake-town.jpg",
    "Wambaa Gulf / Makangale (Pemba)": "zanzibar-traditional-wooden-boat-turquoise-water.jpg"
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
  eleventyConfig.addGlobalData("__zoneImage", zoneImage);

  // Deduplicated attractions: drop duplicate official/tour/listing variants
  eleventyConfig.addGlobalData("__attractionsDedup", () => {
    const raw = require("./src/data/attractions.json");
    const list = Array.isArray(raw) ? raw : raw.attractions || [];
    const dupPattern = /\((Official|Tour|Tour Desk|Main|Ngome Kongwe|Cultural Desk)\)\s*$/;
    const canonical = {};
    for (const a of list) {
      const base = a.name.replace(dupPattern, "").trim();
      if (canonical[base] === undefined) { const c = Object.assign({}, a); c.name = base; canonical[base] = c; }
    }
    return Object.values(canonical);
  });

  // Map an attraction name/category → existing image filename
  const attractionImage = {
    "Baraka Aquarium (Main)": "mnemba-atoll-snorkeling-green-sea-turtle.jpg",
    "Baraka Natural Aquarium": "mnemba-atoll-snorkeling-green-sea-turtle.jpg",
    "Cheetah's Rock": "jozani-forest-sykes-monkey-zanzibar-wildlife-2.jpg",
    "Forodhani Market (Official)": "stone-town-darajani-fish-market-vendors.jpg",
    "Fukuchani Ruins": "packing-beach.jpg",
    "House of Wonders": "packing-beach.jpg",
    "House of Wonders (Official)": "packing-beach.jpg",
    "Jozani Chwaka Bay Nat. Park": "jozani-forest-red-colobus-monkeys.jpg",
    "Kuza Cave": "zanzibar-jambiani-beach-low-tide-local-children.jpg",
    "Mangapwani Slave Chambers": "stone-town-former-slave-market.jpg",
    "Menai Bay Conservation": "zanzibar-traditional-wooden-boat-turquoise-water.jpg",
    "Mnarani Marine Turtle Pond": "mnemba-atoll-snorkeling-green-sea-turtle.jpg",
    "Mrembo Spa & Traditional Services": "stone-town-courtyard-restaurant-emerson-spice.jpg",
    "Nakupenda Sandbank": "nakupenda-sandbank-tour-zanzibar.jpg",
    "Nakupenda Sandbank (Tour)": "nakupenda-sandbank-tour-zanzibar.jpg",
    "Old Fort (Cultural Desk)": "mariola-grobelska-4DhGPppqcDE-unsplash.jpg",
    "Old Fort (Ngome Kongwe)": "mariola-grobelska-4DhGPppqcDE-unsplash.jpg",
    "Palace Museum": "packing-beach.jpg",
    "Palace Museum (Official)": "packing-beach.jpg",
    "Princess Salme Spice Garden": "nutmeg-spice-farm-zanzibar.jpg",
    "Prison Island (Changuu)": "prison-island-wooden-pier-boats-zanzibar.jpg",
    "Prison Island (Tour Desk)": "prison-island-wooden-pier-boats-zanzibar.jpg",
    "Seaweed Center Paje": "seaweed-farming-zanzibar-coast.jpg",
    "Spice Farm Tour (Kidichi)": "nutmeg-spice-farm-zanzibar.jpg",
    "Stone Town Food Market": "stone-town-darajani-market-fresh-produce-vegetables.jpg",
    "Zanzibar Butterfly (Park)": "jozani-forest-red-colobus-monkeys.jpg",
    "Zanzibar Horse Riding (Nungwi)": "horse-riding-in-zanzibar-ocean.jpg",
    "ZIFF Festival Center": "stone-town-courtyard-restaurant-emerson-spice.jpg",
    "The Rock Restaurant": "the-rock-restaurant-michamvi-pingwe-zanzibar.jpg"
  };
  const attrCategoryFallback = {
    "Attraction": "stone-town-zanzibar-aerial-coastline-view.jpg",
    "Dive Center": "zanzibar-snorkeling-coral-reef-shallow-water.jpg",
    "Water Sports": "paje-beach-zanzibar-kitesurfing-indian-ocean.jpg",
    "Restaurant": "the-rock-restaurant-michamvi-pingwe-zanzibar.jpg"
  };
  eleventyConfig.addFilter("attractionImg", (name, category) =>
    attractionImage[name] || attrCategoryFallback[category] || attrCategoryFallback["Attraction"]);

  // Map a hotel zone (free text) → zoneImage key with alias fallback
  const zoneAliases = {
    "stone town": "Stone Town", "stonetown": "Stone Town", "korwe": "Stone Town",
    "nungw": "Nungwi", "kendw": "Kendwa", "paje": "Paje", "jamb": "Jambiani",
    "kiwen": "Kiwengwa", "pongw": "Pongwe / Michamvi", "micha": "Michamvi / Pingwe",
    "pingw": "Michamvi / Pingwe", "bwej": "Bwejuu / Dongwe", "dongw": "Bwejuu / Dongwe",
    "kizim": "Kizimkazi / Dimbani", "fumb": "Fumba / Mbweni", "mbwen": "Fumba / Mbweni",
    "matem": "Matemwe / Kigomani", "kigom": "Matemwe / Kigomani", "muyun": "Matemwe / Kigomani",
    "chake": "Chake Chake (Pemba)", "wete": "Chake Chake (Pemba)", "wambaa": "Wambaa Gulf / Makangale (Pemba)",
    "wamba": "Wambaa Gulf / Makangale (Pemba)", "makang": "Wambaa Gulf / Makangale (Pemba)", "wesha": "Wambaa Gulf / Makangale (Pemba)"
  };
  eleventyConfig.addFilter("zoneImg", (zone) => {
    const z = String(zone || "").toLowerCase().trim();
    for (const [frag, key] of Object.entries(zoneAliases)) if (z.startsWith(frag)) return zoneImage[key];
    for (const key of Object.keys(zoneImage)) if (z.startsWith(key.toLowerCase().split(" /")[0] + " ")) return zoneImage[key];
    return "zanzibar-island-resort-pier-boats.jpg";
  });
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
