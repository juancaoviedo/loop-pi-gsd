export const DEFAULT_PHASE_SIZING = Object.freeze({
  minPhases: 5,
  maxPhases: 50,
  targetComplexityPerPhase: 10,
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function keywordScore(text, keywords) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (lower.includes(keyword)) score += 1;
  }
  return score;
}

export function scoreWorkItem(item) {
  const text = `${item.title || ""} ${item.detail || ""}`.trim();
  const lengthScore = clamp(Math.ceil(text.length / 180), 1, 5);
  const breadth = 1 + keywordScore(text, ["api", "database", "ui", "worker", "integration", "service"]);
  const dependencyDepth = 1 + keywordScore(text, ["depends", "after", "before", "requires", "migration"]);
  const risk = 1 + keywordScore(text, ["security", "failure", "critical", "compliance", "rollback", "unsafe"]);
  const verification = 1 + keywordScore(text, ["test", "validate", "benchmark", "monitor", "evidence"]);

  return {
    itemId: item.id,
    breadth: clamp(breadth, 1, 4),
    dependencyDepth: clamp(dependencyDepth, 1, 4),
    risk: clamp(risk, 1, 4),
    verificationSurface: clamp(verification, 1, 4),
    score: clamp(lengthScore + breadth + dependencyDepth + risk + verification, 4, 24),
  };
}

function splitOversizedItem(item, scoreCard, targetComplexityPerPhase) {
  if (scoreCard.score <= targetComplexityPerPhase) {
    return [{ ...item, complexity: scoreCard.score, parentItemId: null }];
  }

  const parts = Math.ceil(scoreCard.score / targetComplexityPerPhase);
  const sentences = (item.detail || item.title || "")
    .split(/[.!?]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunkSize = Math.max(1, Math.ceil(sentences.length / parts));
  const slices = [];
  for (let i = 0; i < parts; i += 1) {
    const sentenceChunk = sentences.slice(i * chunkSize, (i + 1) * chunkSize);
    const detail = sentenceChunk.length > 0 ? sentenceChunk.join(". ") : item.detail;
    slices.push({
      ...item,
      id: `${item.id}-p${String(i + 1).padStart(2, "0")}`,
      title: `${item.title} (Part ${i + 1}/${parts})`,
      detail,
      parentItemId: item.id,
      complexity: Math.max(1, Math.ceil(scoreCard.score / parts)),
    });
  }
  return slices;
}

function balancedPartition(items, phaseCount) {
  const totalComplexity = items.reduce((sum, item) => sum + item.complexity, 0);
  const targetPerBucket = totalComplexity / phaseCount;
  const phases = [];
  let bucket = [];
  let bucketComplexity = 0;

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const remainingItems = items.length - i;
    const remainingBuckets = phaseCount - phases.length;

    if (
      bucket.length > 0
      && (bucketComplexity + item.complexity > targetPerBucket)
      && remainingItems >= remainingBuckets
    ) {
      phases.push(bucket);
      bucket = [];
      bucketComplexity = 0;
    }

    bucket.push(item);
    bucketComplexity += item.complexity;
  }

  if (bucket.length > 0) phases.push(bucket);

  while (phases.length > phaseCount) {
    if (phases.length < 2) break;

    let mergeIndex = phases.length - 2;
    let minCombined = Number.POSITIVE_INFINITY;

    for (let i = 0; i < phases.length - 1; i += 1) {
      const scoreA = phases[i].reduce((sum, item) => sum + item.complexity, 0);
      const scoreB = phases[i + 1].reduce((sum, item) => sum + item.complexity, 0);
      const combined = scoreA + scoreB;
      if (combined < minCombined) {
        minCombined = combined;
        mergeIndex = i;
      }
    }

    const merged = [...phases[mergeIndex], ...phases[mergeIndex + 1]];
    phases.splice(mergeIndex, 2, merged);
  }

  while (phases.length < phaseCount) {
    let indexOfLargest = 0;
    let maxScore = -1;

    for (let i = 0; i < phases.length; i += 1) {
      const score = phases[i].reduce((sum, item) => sum + item.complexity, 0);
      if (score > maxScore && phases[i].length > 1) {
        indexOfLargest = i;
        maxScore = score;
      }
    }

    const target = phases[indexOfLargest];
    if (!target || target.length <= 1) {
      phases.push([]);
      continue;
    }

    const mid = Math.ceil(target.length / 2);
    const first = target.slice(0, mid);
    const second = target.slice(mid);
    phases.splice(indexOfLargest, 1, first, second);
  }

  return phases;
}

export function computePhaseSizing({ workItems, config = {} }) {
  if (!Array.isArray(workItems) || workItems.length === 0) {
    throw new Error("Cannot size phases without work items.");
  }

  const sizing = {
    ...DEFAULT_PHASE_SIZING,
    ...config,
  };

  if (
    !Number.isInteger(sizing.minPhases)
    || !Number.isInteger(sizing.maxPhases)
    || !Number.isFinite(sizing.targetComplexityPerPhase)
    || sizing.minPhases <= 0
    || sizing.maxPhases < sizing.minPhases
    || sizing.targetComplexityPerPhase <= 0
  ) {
    throw new Error("Invalid phase sizing configuration.");
  }

  const expandedItems = [];
  for (const item of workItems) {
    const scoreCard = scoreWorkItem(item);
    const slices = splitOversizedItem(item, scoreCard, sizing.targetComplexityPerPhase);
    expandedItems.push(...slices);
  }

  const totalComplexity = expandedItems.reduce((sum, item) => sum + item.complexity, 0);
  const rawPhaseCount = Math.ceil(totalComplexity / sizing.targetComplexityPerPhase);
  const phaseCount = clamp(rawPhaseCount, sizing.minPhases, sizing.maxPhases);
  const partition = balancedPartition(expandedItems, phaseCount);

  const phases = partition.map((items, index) => ({
    phaseNumber: index + 1,
    id: `auto-${String(index + 1).padStart(2, "0")}`,
    complexity: items.reduce((sum, item) => sum + item.complexity, 0),
    objectives: items.map((item) => ({
      workItemId: item.id,
      sourceSectionId: item.sectionId,
      title: item.title,
      complexity: item.complexity,
      parentItemId: item.parentItemId ?? null,
    })),
  }));

  return {
    config: sizing,
    totalComplexity,
    rawPhaseCount,
    phaseCount,
    phases,
  };
}
