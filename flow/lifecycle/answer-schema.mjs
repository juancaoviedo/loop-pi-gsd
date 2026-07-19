export function validateResponderAnswer(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    return {
      valid: false,
      errors: ["Responder payload must be an object."],
    };
  }

  if (typeof payload.questionId !== "string" || payload.questionId.trim().length === 0) {
    errors.push("questionId must be a non-empty string.");
  }

  if (typeof payload.answer !== "string" || payload.answer.trim().length === 0) {
    errors.push("answer must be a non-empty string.");
  }

  if (typeof payload.confidence !== "number" || Number.isNaN(payload.confidence)) {
    errors.push("confidence must be a number.");
  } else if (payload.confidence < 0 || payload.confidence > 1) {
    errors.push("confidence must be between 0 and 1.");
  }

  if (payload.rationale !== undefined && typeof payload.rationale !== "string") {
    errors.push("rationale must be a string when provided.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidResponderAnswer(payload) {
  const validation = validateResponderAnswer(payload);
  if (!validation.valid) {
    const error = new Error(`Invalid responder payload: ${validation.errors.join(" ")}`);
    error.retryable = false;
    throw error;
  }
  return payload;
}
