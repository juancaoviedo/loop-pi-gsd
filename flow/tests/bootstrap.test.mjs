import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { ingestSourceDocument } from "../bootstrap/ingest.mjs";
import { buildBootstrapModel } from "../bootstrap/model.mjs";

async function withTempFile(name, content, fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "flow-bootstrap-ingest-"));
  const filePath = path.join(dir, name);
  await fs.writeFile(filePath, content);
  try {
    await fn(filePath);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test("ingestSourceDocument supports markdown, latex, html, and pdf", async () => {
  await withTempFile("input.md", "# Product\n\n- Add API\n- Add UI\n", async (filePath) => {
    const source = await ingestSourceDocument({ filePath });
    assert.equal(source.format, "markdown");
    assert.ok(source.sections.length >= 1);
  });

  await withTempFile("input.tex", "\\section{Goal}\\nBuild a secure API.\\n", async (filePath) => {
    const source = await ingestSourceDocument({ filePath });
    assert.equal(source.format, "latex");
    assert.ok(source.sections.length >= 1);
  });

  await withTempFile("input.html", "<h1>Goal</h1><p>Build an MVP.</p>", async (filePath) => {
    const source = await ingestSourceDocument({ filePath });
    assert.equal(source.format, "html");
    assert.ok(source.sections.length >= 1);
  });

  const fakePdf = "%PDF-1.4\n1 0 obj\n<< /Length 62 >>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(PROJECT OVERVIEW) Tj\n0 -20 Td\n(Build API and tests) Tj\nET\nendstream\nendobj\n";
  await withTempFile("input.pdf", fakePdf, async (filePath) => {
    const source = await ingestSourceDocument({ filePath });
    assert.equal(source.format, "pdf");
    assert.ok(source.sections.length >= 1);
  });
});

test("buildBootstrapModel extracts actionable work items", async () => {
  await withTempFile("input.md", "# Product\n\n## Scope\n- Build API\n- Build UI\n", async (filePath) => {
    const source = await ingestSourceDocument({ filePath });
    const model = buildBootstrapModel({ source });
    assert.ok(model.workItems.length >= 2);
    assert.ok(model.requirements.length >= 2);
    assert.equal(model.source.format, "markdown");
  });
});

test("ingestSourceDocument fails on unsupported or empty input", async () => {
  await withTempFile("input.txt", "hello", async (filePath) => {
    await assert.rejects(() => ingestSourceDocument({ filePath }), /Unsupported input format/);
  });

  await withTempFile("input.md", "   \n", async (filePath) => {
    await assert.rejects(() => ingestSourceDocument({ filePath }), /Input document is empty/);
  });
});
