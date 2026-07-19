const DEFAULT_RETRYABLE_STEPS = Object.freeze(["discuss", "plan", "execute", "verify"]);

export const DEFAULT_RETRY_POLICY = Object.freeze({
  maxRetries: 1,
  retryableSteps: DEFAULT_RETRYABLE_STEPS,
});

function normalizePolicy(policy = {}) {
  const merged = {
    ...DEFAULT_RETRY_POLICY,
    ...policy,
  };

  if (!Number.isInteger(merged.maxRetries) || merged.maxRetries < 0) {
    throw new Error("Invalid retry policy: maxRetries must be a non-negative integer.");
  }

  if (!Array.isArray(merged.retryableSteps) || merged.retryableSteps.length === 0) {
    throw new Error("Invalid retry policy: retryableSteps must be a non-empty array.");
  }

  return {
    maxRetries: merged.maxRetries,
    retryableSteps: [...new Set(merged.retryableSteps)],
  };
}

export function shouldRetryStep({ step, attempt, error, policy }) {
  const normalized = normalizePolicy(policy);
  if (!normalized.retryableSteps.includes(step)) return false;
  if (attempt >= normalized.maxRetries) return false;
  if (error && error.retryable === false) return false;
  return true;
}

export async function runStepWithRetry({ step, policy, runner }) {
  if (typeof runner !== "function") {
    throw new Error("runStepWithRetry requires a runner function.");
  }

  const normalized = normalizePolicy(policy);
  let attempt = 0;

  while (true) {
    try {
      const result = await runner({ attempt });
      return {
        ok: true,
        attempts: attempt + 1,
        result,
      };
    } catch (error) {
      const canRetry = shouldRetryStep({ step, attempt, error, policy: normalized });
      if (!canRetry) {
        return {
          ok: false,
          attempts: attempt + 1,
          error,
        };
      }
      attempt += 1;
    }
  }
}
