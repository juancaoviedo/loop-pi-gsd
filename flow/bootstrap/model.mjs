import { ingestSourceDocument } from "./ingest.mjs";

function cleanupLine(line) {
  return line.replace(/^[-*]\s+/, "").trim();
}

function collectBulletLikeItems(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map(cleanupLine);
}

function sentenceChunks(text) {
  return text
    .split(/[.!?]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildWorkItems(sections) {
  const items = [];
  for (const section of sections) {
    const bullets = collectBulletLikeItems(section.content);
    if (bullets.length > 0) {
      for (let i = 0; i < bullets.length; i += 1) {
        items.push({
          id: `${section.id}-w${String(i + 1).padStart(2, "0")}`,
          sectionId: section.id,
          title: bullets[i],
          detail: section.content,
        });
      }
      continue;
    }

    const chunks = sentenceChunks(section.content);
    if (chunks.length === 0) {
      items.push({
        id: `${section.id}-w01`,
        sectionId: section.id,
        title: section.heading,
        detail: section.content,
      });
      continue;
    }

    for (let i = 0; i < chunks.length; i += 1) {
      items.push({
        id: `${section.id}-w${String(i + 1).padStart(2, "0")}`,
        sectionId: section.id,
        title: chunks[i].slice(0, 120),
        detail: chunks[i],
      });
    }
  }
  return items;
}

function inferProjectTitle(sections) {
  const firstHeading = sections.find((section) => section.heading && section.heading !== "Overview");
  return firstHeading?.heading ?? "Generated Project";
}

export function buildBootstrapModel({ source }) {
  if (!source || !Array.isArray(source.sections)) {
    throw new Error("Invalid source payload for model building.");
  }

  const nonEmptySections = source.sections.filter(
    (section) => section && (section.heading?.trim() || section.content?.trim()),
  );
  if (nonEmptySections.length === 0) {
    throw new Error("Cannot build model from empty source sections.");
  }

  const workItems = buildWorkItems(nonEmptySections);
  if (workItems.length === 0) {
    throw new Error("No actionable work items extracted from source.");
  }

  const requirements = workItems.slice(0, 20).map((item, index) => ({
    id: `BOOT-AUTO-${String(index + 1).padStart(2, "0")}`,
    text: item.title,
    sourceSectionId: item.sectionId,
  }));

  return {
    source: {
      filePath: source.filePath,
      format: source.format,
      sectionCount: nonEmptySections.length,
      sectionIds: nonEmptySections.map((section) => section.id),
    },
    project: {
      title: inferProjectTitle(nonEmptySections),
      summary: nonEmptySections[0]?.content?.slice(0, 400) ?? "",
      constraints: nonEmptySections
        .filter((section) => /constraint|non-functional|risk|limit/i.test(section.heading))
        .map((section) => section.content)
        .join("\n")
        .slice(0, 1200),
    },
    workItems,
    requirements,
    sections: nonEmptySections,
  };
}

export async function buildBootstrapModelFromFile({ filePath }) {
  const source = await ingestSourceDocument({ filePath });
  return buildBootstrapModel({ source });
}
