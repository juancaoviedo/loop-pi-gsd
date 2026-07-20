#!/usr/bin/env node

import fs from "node:fs/promises";
import readline from "node:readline";

import {
  AGENT_B_PROTOCOL_SCHEMA_MAJOR,
  buildProtocolError,
  encodeAgentBRequest,
  parseAgentBLine,
  validateAgentBEnvelope,
} from "./agent-b-protocol.mjs";

function buildEnvelope({ requestType, correlationId, payload }) {
  return {
    schemaVersion: `${AGENT_B_PROTOCOL_SCHEMA_MAJOR}.0.0`,
    requestType,
    correlationId,
    agentRole: "agent-b",
    payload,
  };
}

async function loadRuntimeConfig() {
  const configPath = process.env.AGENT_B_CONFIG_PATH;
  if (!configPath) {
    return {
      providerId: process.env.AGENT_B_PROVIDER_ID ?? "stub-b",
      modelId: process.env.AGENT_B_MODEL_ID ?? "stub-model-b",
      testBehavior: process.env.AGENT_B_TEST_BEHAVIOR ?? null,
    };
  }

  try {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      providerId: parsed.providerId ?? process.env.AGENT_B_PROVIDER_ID ?? "stub-b",
      modelId: parsed.modelId ?? process.env.AGENT_B_MODEL_ID ?? "stub-model-b",
      testBehavior: parsed.testBehavior ?? process.env.AGENT_B_TEST_BEHAVIOR ?? null,
    };
  } catch {
    return {
      providerId: process.env.AGENT_B_PROVIDER_ID ?? "stub-b",
      modelId: process.env.AGENT_B_MODEL_ID ?? "stub-model-b",
      testBehavior: process.env.AGENT_B_TEST_BEHAVIOR ?? null,
    };
  }
}

function buildAnswer({ config, correlationId, questionText }) {
  if (config.testBehavior === "crash") {
    process.exitCode = 17;
    process.exit(17);
  }

  if (config.testBehavior === "non-responsive") {
    return null;
  }

  if (config.testBehavior === "empty-answer") {
    return buildEnvelope({
      requestType: "answer",
      correlationId,
      payload: {
        answer: "",
        providerMetadata: {
          providerName: "stub-provider-b",
          providerRequestId: `req-${correlationId}`,
          providerStatusCode: 200,
          providerLatencyMs: 1,
        },
      },
    });
  }

  return buildEnvelope({
    requestType: "answer",
    correlationId,
    payload: {
      answer: `Agent B (${config.modelId}) response: ${questionText}`,
      providerMetadata: {
        providerName: "stub-provider-b",
        providerRequestId: `req-${correlationId}`,
        providerStatusCode: 200,
        providerLatencyMs: 1,
      },
    },
  });
}

async function main() {
  const config = await loadRuntimeConfig();

  const handshake = buildEnvelope({
    requestType: "capability-echo",
    correlationId: "startup",
    payload: {
      providerId: config.providerId,
      modelId: config.modelId,
    },
  });

  process.stdout.write(encodeAgentBRequest(handshake));

  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  rl.on("line", (line) => {
    try {
      const parsed = parseAgentBLine(line);
      const message = validateAgentBEnvelope(parsed);

      if (message.requestType !== "spec-phase-question" && message.requestType !== "discuss-phase-question") {
        throw buildProtocolError("agent_b.transport_schema_invalid", `Unsupported requestType in child: ${message.requestType}`);
      }

      const questionText = String(message.payload.question ?? "").trim();
      const answerEnvelope = buildAnswer({
        config,
        correlationId: message.correlationId,
        questionText,
      });

      if (answerEnvelope) {
        process.stdout.write(encodeAgentBRequest(answerEnvelope));
      }
    } catch (error) {
      const event = buildEnvelope({
        requestType: "error",
        correlationId: "runtime-error",
        payload: {
          code: error.code ?? "agent_b.transport_schema_invalid",
          message: error.message,
        },
      });
      process.stdout.write(encodeAgentBRequest(event));
    }
  });
}

await main();
