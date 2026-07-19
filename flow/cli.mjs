#!/usr/bin/env node

import crypto from "node:crypto";
import path from "node:path";

import { assertCanonicalFlowCommand } from "./kernel/commands.mjs";
import { ingestSourceDocument } from "./bootstrap/ingest.mjs";
import { buildBootstrapModel } from "./bootstrap/model.mjs";
import { computePhaseSizing } from "./bootstrap/phase-sizing.mjs";
import { mergePlanningArtifacts } from "./bootstrap/merge-planning.mjs";
import { persistTraceMap } from "./bootstrap/trace-map.mjs";
import { loadRoadmapAndState, selectTargetPhases } from "./orchestrator/select-phases.mjs";
import { buildOrchestratorRunId, buildIsolationDescriptors } from "./orchestrator/isolation.mjs";
import { buildInterceptionMetadata } from "./orchestrator/interception.mjs";
import { buildResponderContextPack } from "./orchestrator/context-pack.mjs";
import { persistOrchestratorManifest } from "./orchestrator/run-manifest.mjs";
import { runLifecycleForSelectedPhases } from "./lifecycle/engine.mjs";
import { persistLifecycleResult } from "./lifecycle/persist-lifecycle.mjs";
import { persistImmutableRunMetadata } from "./governance/run-metadata.mjs";
import { buildEvidenceBundle, persistEvidenceBundle } from "./governance/evidence-bundle.mjs";
import { evaluateEscalation } from "./governance/escalation-policy.mjs";
import { normalizeDelegationRecords } from "./governance/delegation-evidence.mjs";
import { buildMemoryIndex, persistMemoryIndex } from "./governance/memory-index.mjs";
import { buildReconciliationReport, persistReconciliationReport } from "./governance/reconcile-memory.mjs";
import { appendDiscussionLog } from "./governance/discussion-log.mjs";

function printUsage() {
  console.error("Usage: node flow/cli.mjs <flow-create-additional-phases|flow-execute-all-phases> [source-file] [--min-phases N --max-phases N --target-complexity N]");
}

function parseSizingArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--min-phases") {
      result.minPhases = Number(argv[i + 1]);
      i += 1;
    } else if (token === "--max-phases") {
      result.maxPhases = Number(argv[i + 1]);
      i += 1;
    } else if (token === "--target-complexity") {
      result.targetComplexityPerPhase = Number(argv[i + 1]);
      i += 1;
    }
  }
  return result;
}

function parseExecutionArgs(argv) {
  const result = {
    phaseNumbers: [],
    limit: null,
    runLifecycle: false,
    maxRetries: null,
    runGovernance: false,
    riskThreshold: null,
    confidenceThreshold: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--phase") {
      const numeric = Number(argv[i + 1]);
      if (Number.isInteger(numeric) && numeric > 0) {
        result.phaseNumbers.push(numeric);
      }
      i += 1;
    } else if (token === "--limit") {
      const limit = Number(argv[i + 1]);
      if (Number.isInteger(limit) && limit > 0) {
        result.limit = limit;
      }
      i += 1;
    } else if (token === "--run-lifecycle") {
      result.runLifecycle = true;
    } else if (token === "--max-retries") {
      const maxRetries = Number(argv[i + 1]);
      if (Number.isInteger(maxRetries) && maxRetries >= 0) {
        result.maxRetries = maxRetries;
      }
      i += 1;
    } else if (token === "--run-governance") {
      result.runGovernance = true;
    } else if (token === "--risk-threshold") {
      const riskThreshold = Number(argv[i + 1]);
      if (!Number.isNaN(riskThreshold)) {
        result.riskThreshold = riskThreshold;
      }
      i += 1;
    } else if (token === "--confidence-threshold") {
      const confidenceThreshold = Number(argv[i + 1]);
      if (!Number.isNaN(confidenceThreshold)) {
        result.confidenceThreshold = confidenceThreshold;
      }
      i += 1;
    }
  }

  return result;
}

function buildDeterministicRunId(source, sizingConfig) {
  const hash = crypto
    .createHash("sha1")
    .update(source.filePath)
    .update(source.format)
    .update(source.text)
    .update(JSON.stringify(sizingConfig))
    .digest("hex")
    .slice(0, 12);
  return `bootstrap-${hash}`;
}

async function runBootstrapWorkflow({ sourcePath, sizingArgs }) {
  const source = await ingestSourceDocument({ filePath: sourcePath });
  const model = buildBootstrapModel({ source });
  const phaseSizing = computePhaseSizing({ workItems: model.workItems, config: sizingArgs });
  const runId = buildDeterministicRunId(source, phaseSizing.config);
  const projectRoot = process.cwd();

  const writes = await mergePlanningArtifacts({
    projectRoot,
    model,
    phaseSizing,
    runId,
  });

  const trace = await persistTraceMap({
    projectRoot,
    runId,
    model,
    phaseSizing,
    artifactWrites: writes,
  });

  return {
    runId,
    source: path.resolve(sourcePath),
    phaseCount: phaseSizing.phaseCount,
    tracePath: path.relative(projectRoot, trace.tracePath),
    artifacts: writes,
  };
}

async function runExecutionOrchestrator({ argv }) {
  const projectRoot = process.cwd();
  const options = parseExecutionArgs(argv);
  const { phases, completedPhases, currentPhase, stateText } = await loadRoadmapAndState({
    roadmapPath: path.join(projectRoot, ".planning", "ROADMAP.md"),
    statePath: path.join(projectRoot, ".planning", "STATE.md"),
  });

  const selectedPhases = selectTargetPhases({
    phases,
    completedPhases,
    currentPhase,
    options,
  });

  if (selectedPhases.length === 0) {
    throw new Error("No eligible phases selected for execution orchestrator.");
  }

  const runId = buildOrchestratorRunId({ selectedPhases, stateDigest: stateText });
  const descriptors = buildIsolationDescriptors({
    runId,
    selectedPhases,
    projectRoot,
  });
  const interception = buildInterceptionMetadata({ selectedPhases });
  const contextPack = await buildResponderContextPack({
    projectRoot,
    selectedPhases,
    descriptors,
  });

  const payload = {
    workflow: "flow-execute-all-phases",
    runId,
    selectedPhases,
    descriptors,
    interception,
    contextPack,
  };

  const { manifestPath } = await persistOrchestratorManifest({
    projectRoot,
    runId,
    payload,
  });

  if (options.runLifecycle) {
    const lifecyclePolicy = options.maxRetries === null ? undefined : { maxRetries: options.maxRetries };
    const lifecycleResults = await runLifecycleForSelectedPhases({
      runId,
      selectedPhases,
      descriptors,
      policy: lifecyclePolicy,
    });

    const persistedLifecycle = [];
    for (const lifecycleResult of lifecycleResults) {
      const descriptor = descriptors.find((item) => item.phaseNumber === lifecycleResult.phaseNumber);
      const persisted = await persistLifecycleResult({
        descriptor,
        lifecycleResult,
      });
      persistedLifecycle.push({
        phaseNumber: lifecycleResult.phaseNumber,
        status: lifecycleResult.status,
        filePath: path.relative(projectRoot, persisted.filePath),
      });
    }

    payload.lifecycleResults = lifecycleResults;
    payload.lifecycleArtifacts = persistedLifecycle;
  }

  if (options.runGovernance) {
    const lifecycleResults = payload.lifecycleResults ?? [];
    const lifecycleArtifacts = payload.lifecycleArtifacts ?? [];
    const delegationRecords = normalizeDelegationRecords(
      payload.contextPack?.phases?.map((phase) => ({
        phaseNumber: phase.phaseNumber,
        questionId: `${phase.phaseId}-default`,
        workflow: "discuss-phase",
        agentId: "responder-agent",
        question: `Clarify execution intent for ${phase.phaseId}`,
        answer: `Use deterministic execution constraints from PROJECT/REQUIREMENTS/ROADMAP/STATE and phase artifacts.`,
        rationale: "default delegation trace",
        confidence: 0.75,
        riskScore: lifecycleResults.find((item) => item.phaseNumber === phase.phaseNumber)?.status === "complete" ? 0.2 : 0.9,
        escalationDisposition: "pending-policy",
      })) ?? [],
    );

    const immutableMetadata = await persistImmutableRunMetadata({
      projectRoot,
      runId,
      metadata: {
        runId,
        selectedPhases: selectedPhases.map((phase) => ({ phaseNumber: phase.phaseNumber, phaseId: phase.id })),
        manifestPath: path.relative(projectRoot, manifestPath),
        policyVersion: 1,
      },
    });

    const evidenceBundle = buildEvidenceBundle({
      runId,
      manifestPath: path.relative(projectRoot, manifestPath),
      lifecycleArtifacts,
      delegationRecords,
    });
    const evidencePersisted = await persistEvidenceBundle({ projectRoot, runId, evidenceBundle });

    const escalation = evaluateEscalation({
      policy: {
        ...(options.riskThreshold === null ? {} : { riskThreshold: options.riskThreshold }),
        ...(options.confidenceThreshold === null ? {} : { confidenceThreshold: options.confidenceThreshold }),
      },
      lifecycleResults,
      delegationRecords,
    });

    const memoryIndex = buildMemoryIndex({
      runId,
      selectedPhases,
      lifecycleResults,
    });
    const memoryPersisted = await persistMemoryIndex({ projectRoot, runId, memoryIndex });

    const reconciliation = buildReconciliationReport({
      selectedPhases,
      lifecycleResults,
    });
    const reconciliationPersisted = await persistReconciliationReport({
      projectRoot,
      runId,
      report: reconciliation,
    });

    const discussionLogs = [];
    for (const phase of selectedPhases) {
      const phaseRecords = delegationRecords.filter((record) => record.phaseNumber === phase.phaseNumber);
      const appended = await appendDiscussionLog({
        projectRoot,
        runId,
        phaseNumber: phase.phaseNumber,
        records: phaseRecords,
      });
      if (appended) {
        discussionLogs.push({
          phaseNumber: phase.phaseNumber,
          filePath: path.relative(projectRoot, appended.filePath),
        });
      }
    }

    payload.governance = {
      immutableMetadata: {
        filePath: path.relative(projectRoot, immutableMetadata.filePath),
        immutable: immutableMetadata.immutable,
        created: immutableMetadata.created,
      },
      evidenceBundle: {
        filePath: path.relative(projectRoot, evidencePersisted.filePath),
        checkpoints: evidenceBundle.checkpoints,
      },
      escalation,
      memoryIndex: {
        filePath: path.relative(projectRoot, memoryPersisted.filePath),
        links: memoryIndex.links,
      },
      reconciliation: {
        filePath: path.relative(projectRoot, reconciliationPersisted.filePath),
        mismatchCount: reconciliation.mismatchCount,
        reconciled: reconciliation.reconciled,
      },
      finalizationBlocked: escalation.gateStatus === "human-review-required",
      delegationRecords,
      discussionLogs,
    };
  }

  return {
    ...payload,
    manifestPath: path.relative(projectRoot, manifestPath),
  };
}

async function main(argv) {
  const commandArg = argv[2] ?? "";
  try {
    const workflow = assertCanonicalFlowCommand(commandArg);
    const sourceArg = argv[3] ?? "";
    const sizingArgs = parseSizingArgs(argv.slice(4));

    if (workflow === "flow-create-additional-phases" && sourceArg) {
      const result = await runBootstrapWorkflow({ sourcePath: sourceArg, sizingArgs });
      process.stdout.write(`${JSON.stringify({ workflow, ...result }, null, 2)}\n`);
      return;
    }

    if (workflow === "flow-execute-all-phases" && argv.length > 3) {
      const result = await runExecutionOrchestrator({ argv: argv.slice(3) });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return;
    }

    process.stdout.write(`${workflow}\n`);
  } catch (error) {
    printUsage();
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

await main(process.argv);
