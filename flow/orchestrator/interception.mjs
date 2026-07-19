const DEFAULT_INTERCEPT_RULES = Object.freeze([
  {
    workflow: "spec-phase",
    interactionType: "question-round",
    route: "responder-agent",
    policy: "deterministic-context-pack",
  },
  {
    workflow: "discuss-phase",
    interactionType: "question-round",
    route: "responder-agent",
    policy: "deterministic-context-pack",
  },
]);

export function buildInterceptionMetadata({ selectedPhases }) {
  return {
    schemaVersion: 1,
    interceptionEnabled: true,
    phases: selectedPhases.map((phase) => ({
      phaseNumber: phase.phaseNumber,
      phaseId: phase.id,
      rules: DEFAULT_INTERCEPT_RULES,
    })),
  };
}
