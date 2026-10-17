export type ParsedDescription = {
  story: string[];
  specs: { label: string; value: string }[];
  care: string[];
};

const SECTION_HEADINGS = /^(product description|product specification|care instructions)$/i;

// Splits the "Product Description / Product Specification / Care Instructions"
// layout used by the imported catalog. Anything else falls through as story text.
export function parseDescription(text: string | null): ParsedDescription {
  const result: ParsedDescription = { story: [], specs: [], care: [] };
  if (!text) return result;

  let section: "story" | "specs" | "care" = "story";
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    if (SECTION_HEADINGS.test(line)) {
      const heading = line.toLowerCase();
      section = heading.includes("specification")
        ? "specs"
        : heading.includes("care")
          ? "care"
          : "story";
      continue;
    }

    if (section === "specs") {
      const specLine = line.replace(/^[-•*]\s*/, "");
      const idx = specLine.indexOf(":");
      if (idx > 0) {
        const label = specLine.slice(0, idx).trim();
        const value = specLine.slice(idx + 1).trim();
        // The name already heads the page, so skip it when repeated as a spec
        if (value && !/^product( name)?$/i.test(label)) {
          result.specs.push({ label, value });
        }
        continue;
      }
    }

    if (section === "care") {
      result.care.push(line.replace(/^-\s*/, ""));
      continue;
    }

    result.story.push(line);
  }

  return result;
}
