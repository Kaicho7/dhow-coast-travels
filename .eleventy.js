module.exports = function(eleventyConfig) {
  // Passthrough copy for static assets - copy contents of public to output root
  eleventyConfig.addPassthroughCopy({"public/css": "css"});
  eleventyConfig.addPassthroughCopy({"public/js": "js"});
  eleventyConfig.addPassthroughCopy({"public/images": "images"});
  // Add data extension for problem page intents
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
    return {};
  });
  // Add WhatsApp CTA filter
  eleventyConfig.addNunjucksFilter("whatsappCTA", function() {
    return `<a href="https://wa.me/255672450934?text=${encodeURIComponent(this.intent?.cta_text || 'Message us on WhatsApp for customized itinerary')}" target="_blank" rel="noopener" class="btn btn-accent btn-lg">Custom Itinerary</a>`;
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
