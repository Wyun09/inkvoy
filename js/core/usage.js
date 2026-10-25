const HAN_CHARACTER = /\p{Script=Han}/u;

// Twelve units per token keeps the requested 2/3 and 1/4 weights exact.
// Iterate code points so a supplementary Han character or emoji is counted once.
function weightedUnits(text) {
  if (typeof text !== 'string') return 0;
  let units = 0;
  for (const character of text) units += HAN_CHARACTER.test(character) ? 8 : 3;
  return units;
}

/**
 * Heuristic text usage only: ceil(Han characters / 1.5 + other code points / 4).
 * This is not the upstream tokenizer or billing usage. Image tokens are unknown
 * and deliberately excluded; callers must expose that fact in usage metadata.
 */
export function estimateUsage({ prompt = '', content = '', reasoning = '', images } = {}) {
  const promptTokens = Math.ceil(weightedUnits(prompt) / 12);
  const reasoningUnits = weightedUnits(reasoning);
  const completionTokens = Math.ceil((weightedUnits(content) + reasoningUnits) / 12);
  const reasoningTokens = Math.ceil(reasoningUnits / 12);
  // Accept images for a consistent call signature without inventing their cost.
  void images;
  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
    completion_tokens_details: { reasoning_tokens: reasoningTokens },
  };
}
