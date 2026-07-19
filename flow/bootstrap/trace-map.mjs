import fs from "node:fs/promises";
import path from "node:path";

export async function persistTraceMap({
  projectRoot,
  runId,
  model,
  phaseSizing,
  artifactWrites,
}) {
  if (!projectRoot || !runId || !model || !phaseSizing || !Array.isArray(artifactWrites)) {
    throw new Error("Missing trace map inputs.");
  }

  const trace = {
    runId,
    createdAt: new Date().toISOString(),
    source: {
      filePath: model.source.filePath,
      format: model.source.format,
      sectionCount: model.source.sectionCount,
      sections: model.sections.map((section) => ({
        id: section.id,
        heading: section.heading,
        level: section.level,
      })),
    },
    sizing: {
      config: phaseSizing.config,
      totalComplexity: phaseSizing.totalComplexity,
      rawPhaseCount: phaseSizing.rawPhaseCount,
      phaseCount: phaseSizing.phaseCount,
    },
    artifacts: artifactWrites.map((write) => ({
      target: write.artifact,
      marker: write.marker,
      changed: write.changed,
      sourceSectionIds: write.sourceSectionIds,
    })),
    phaseMappings: phaseSizing.phases.map((phase) => ({
      phaseNumber: phase.phaseNumber,
      phaseId: phase.id,
      complexity: phase.complexity,
      objectiveMappings: phase.objectives.map((objective) => ({
        workItemId: objective.workItemId,
        sourceSectionId: objective.sourceSectionId,
        complexity: objective.complexity,
      })),
    })),
  };

  const runDir = path.join(projectRoot, "flow", "runs", runId);
  await fs.mkdir(runDir, { recursive: true });

  const tracePath = path.join(runDir, "trace-map.json");
  await fs.writeFile(tracePath, `${JSON.stringify(trace, null, 2)}\n`, "utf8");

  return {
    tracePath,
    trace,
  };
}
