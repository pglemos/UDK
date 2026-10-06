export function parseRegulationSections(content: string) {
  return content
    .trim()
    .split(/\n\s*\n/)
    .filter((block) => block.trim())
    .map((block, index) => {
      const [heading, ...body] = block
        .trim()
        .split("\n")
        .map((line) => line.trim());
      return {
        id: `secao-${index + 1}`,
        heading: heading ?? `Seção ${index + 1}`,
        body: body.join(" "),
      };
    });
}
