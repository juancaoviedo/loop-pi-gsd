function sortChecks(checks) {
  return [...checks].sort((a, b) => a.name.localeCompare(b.name));
}

export function buildVerificationResult({ checks }) {
  if (!Array.isArray(checks)) {
    throw new Error("Verification checks must be an array.");
  }

  const normalized = sortChecks(
    checks.map((check) => ({
      name: String(check.name),
      status: check.status === "pass" ? "pass" : "fail",
      details: check.details ?? "",
    })),
  );

  const hasChecks = normalized.length > 0;
  const allPass = hasChecks && normalized.every((check) => check.status === "pass");

  return {
    schemaVersion: 1,
    checks: normalized,
    verdict: allPass ? "pass" : "fail",
    hasChecks,
  };
}

export function enforceVerificationGate({ verification, evidenceRefs }) {
  const evidence = Array.isArray(evidenceRefs) ? evidenceRefs.filter(Boolean) : [];
  const passed =
    verification
    && verification.schemaVersion === 1
    && verification.hasChecks === true
    && verification.verdict === "pass"
    && evidence.length > 0;

  return {
    passed,
    reason: passed
      ? null
      : "Verification gate failed: missing passing verification checks or evidence references.",
    evidenceRefs: evidence,
  };
}
