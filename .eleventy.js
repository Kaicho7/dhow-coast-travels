module.exports = function(eleventyConfig) {
  // Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy("public");
  // Enable deep data merging
  eleventyConfig.setDataDeepMerge(true);
  // Add a filter for JSON stringification (useful for JSON‑LD)
  eleventyConfig.addNunjucksFilter("json", function(value) {
    return JSON.stringify(value);
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
