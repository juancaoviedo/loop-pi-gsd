import fs from "node:fs/promises";

function parseFrontmatterValue(source, key) {
  const match = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(source);
  return match ? match[1].trim() : null;
}

function parseCompletedPhases(stateText) {
  const fromProgress = parseFrontmatterValue(stateText, "completed_phases");
  if (fromProgress && /^\d+$/.test(fromProgress)) return Number(fromProgress);
  return 0;
}

function parseCurrentPhase(stateText) {
  const current = parseFrontmatterValue(stateText, "current_phase");
  if (!current) return null;
  const numeric = current.replace(/[^0-9]/g, "");
  if (!numeric) return null;
  return Number(numeric);
}

function parseRequirements(line) {
  if (!line) return [];
  return line
    .split(":")
    .slice(1)
    .join(":")
    .split(",")
    .map((part) => part.replace(/\*\*/g, "").trim())
    .filter(Boolean);
}

export function parseRoadmapPhases(roadmapText) {
  const lines = roadmapText.replace(/\r\n/g, "\n").split("\n");
  const phases = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const headingMatch = /^###\s+Phase\s+(\d+):\s+(.+)$/.exec(line);
    if (!headingMatch) continue;

    const phaseNumber = Number(headingMatch[1]);
    const name = headingMatch[2].trim();

    let goal = "";
    let requirements = [];
    for (let j = i + 1; j < Math.min(lines.length, i + 20); j += 1) {
      const lookahead = lines[j];
      if (/^###\s+Phase\s+\d+:/i.test(lookahead)) break;
      const goalMatch = /^\*\*Goal:\*\*\s*(.+)$/.exec(lookahead);
      if (goalMatch && !goal) goal = goalMatch[1].trim();
      if (lookahead.startsWith("**Requirements:**")) requirements = parseRequirements(lookahead);
    }

    phases.push({
      phaseNumber,
      id: `phase-${String(phaseNumber).padStart(2, "0")}`,
      name,
      goal,
      requirements,
    });
  }

  return phases.sort((a, b) => a.phaseNumber - b.phaseNumber);
}

export async function loadRoadmapAndState({ roadmapPath, statePath }) {
  const [roadmapText, stateText] = await Promise.all([
    fs.readFile(roadmapPath, "utf8"),
    fs.readFile(statePath, "utf8"),
  ]);

  return {
    roadmapText,
    stateText,
    phases: parseRoadmapPhases(roadmapText),
    completedPhases: parseCompletedPhases(stateText),
    currentPhase: parseCurrentPhase(stateText),
  };
}

export function selectTargetPhases({ phases, completedPhases = 0, currentPhase = null, options = {} }) {
  if (!Array.isArray(phases) || phases.length === 0) {
    throw new Error("No phases available for selection.");
  }

  const explicit = Array.isArray(options.phaseNumbers) && options.phaseNumbers.length > 0
    ? [...new Set(options.phaseNumbers.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))]
    : null;

  const pendingStart = Math.max(completedPhases + 1, currentPhase ?? 1);
  let selected = phases.filter((phase) => phase.phaseNumber >= pendingStart);

  if (explicit) {
    selected = phases.filter((phase) => explicit.includes(phase.phaseNumber));
  }

  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : null;
  if (limit) selected = selected.slice(0, limit);

  return selected;
}
