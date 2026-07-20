import fs from "node:fs/promises";
import path from "node:path";

import { AGENT_B_REASON_CODES } from "./agent-b-reason-codes.mjs";

export const AGENT_B_CONFIG_ALLOWLIST = Object.freeze([
  "providerId",
  "modelId",
  "providerName",
  "testBehavior",
  "perTryTimeoutMs",
  "maxAttempts",
]);

function normalizePath(projectRoot, configPath) {
  if (!configPath || typeof configPath !== "string" || configPath.trim().length === 0) {
    return null;
  }
  return path.isAbsolute(configPath) ? configPath : path.join(projectRoot, configPath);
}

function normalizeConfig(parsed) {
  const normalized = {};
  for (const key of AGENT_B_CONFIG_ALLOWLIST) {
    if (key in parsed) {
      normalized[key] = parsed[key];
    }
  }
  return normalized;
}

export async function loadAgentBConfig({ projectRoot, configPath }) {
  const resolvedPath = normalizePath(projectRoot, configPath);
  if (!resolvedPath) {
    return {
      ok: false,
      reasonCode: AGENT_B_REASON_CODES.startup_config_missing,
    };
  }

  let parsed;
  try {
    const raw = await fs.readFile(resolvedPath, "utf8");
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      reasonCode: AGENT_B_REASON_CODES.startup_config_invalid,
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      reasonCode: AGENT_B_REASON_CODES.startup_config_invalid,
    };
  }

  const normalized = normalizeConfig(parsed);
  if (typeof normalized.providerId !== "string" || normalized.providerId.trim().length === 0) {
    return {
      ok: false,
      reasonCode: AGENT_B_REASON_CODES.startup_config_invalid,
    };
  }
  if (typeof normalized.modelId !== "string" || normalized.modelId.trim().length === 0) {
    return {
      ok: false,
      reasonCode: AGENT_B_REASON_CODES.startup_config_invalid,
    };
  }

  return {
    ok: true,
    config: normalized,
    resolvedPath,
  };
}
