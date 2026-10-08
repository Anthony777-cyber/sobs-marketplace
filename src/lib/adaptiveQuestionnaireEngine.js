const MAX_STRUCTURED_QUESTIONS = 12;

const CONNECTOR_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'for', 'with', 'in', 'on', 'to',
  'from', 'by', 'it', 'is', 'this', 'that', 'my', 'your',
]);

const GENERIC_WORDS = new Set([
  'item', 'thing', 'object', 'stuff', 'something',
]);

// These are cues for descriptive features, not a list of items the machine
// must recognise. The seller's own words remain the source of the keywords.
const FEATURE_WORDS = new Set([
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
  'pink', 'brown', 'grey', 'gray', 'silver', 'gold', 'beige', 'cream',
  'ivory', 'clear', 'transparent', 'colourful', 'colorful',
  'wood', 'wooden', 'metal', 'metallic', 'steel', 'stainless', 'iron',
  'plastic', 'glass', 'ceramic', 'leather', 'fabric', 'cotton', 'wool',
  'paper', 'cardboard', 'stone', 'marble', 'concrete', 'rubber', 'brass',
  'copper', 'bronze', 'chrome', 'aluminium', 'aluminum',
  'working', 'faulty', 'broken', 'damaged', 'incomplete', 'restored',
  'refurbished', 'new', 'used', 'worn', 'tested', 'untested',
  'old', 'vintage', 'antique', 'modern', 'retro', 'rare',
  'large', 'small', 'miniature', 'tall', 'short', 'wide', 'narrow',
  'heavy', 'light', 'round', 'square', 'oval', 'rectangular', 'folding',
  'adjustable', 'portable', 'electric', 'electrical', 'manual',
  'automatic', 'indoor', 'outdoor', 'left', 'right', 'single', 'double',
  'pair', 'set', 'with', 'without', 'striped', 'plain', 'patterned',
]);

function clean(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function words(value) {
  return clean(value).toLowerCase().match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g) || [];
}

function isUnknown(value) {
  return !clean(value)
    || /^(?:don't know|do not know|unknown|not sure|unsure|n\/a|na|skip|-)$/i.test(clean(value));
}

function question(id, label, placeholder) {
  return { id, label, placeholder };
}

export function createInitialQuestion() {
  return question(
    'description',
    'What is it in one word?',
    'e.g. lamp, chair, book',
  );
}

export function buildKeywordGroups(answers = {}) {
  const fields = [
    { id: 'description', label: 'Broad category / starting description' },
    { id: 'type', label: 'Narrower type' },
    { id: 'feature', label: 'Feature / distinguishing detail' },
    { id: 'freeform', label: 'Additional keywords' },
  ];

  return fields
    .map((field) => ({ ...field, value: clean(answers[field.id]) }))
    .filter((field) => field.value && !isUnknown(field.value));
}

export function buildSearchTerms(answers = {}) {
  const result = [];
  const seen = new Set();

  const add = (value) => {
    const term = clean(value).toLowerCase();
    if (!term || isUnknown(term) || seen.has(term)) return;
    seen.add(term);
    result.push(term);
  };

  for (const group of buildKeywordGroups(answers)) {
    add(group.value);
    for (const word of words(group.value)) {
      if (!CONNECTOR_WORDS.has(word) && !GENERIC_WORDS.has(word)) add(word);
    }
  }

  return result;
}

function substantiveWords(value) {
  return words(value).filter((word) =>
    !CONNECTOR_WORDS.has(word)
    && !GENERIC_WORDS.has(word)
    && !FEATURE_WORDS.has(word)
  );
}

function hasNarrowerType(description) {
  // A lone category such as "lamp" is broad. A phrase such as
  // "desk lamp" or "angle poise lamp" already provides a narrower type.
  return substantiveWords(description).length > 1;
}

function hasFeatureWords(value) {
  return words(value).some((word) => FEATURE_WORDS.has(word));
}

function broadTerm(description) {
  const terms = substantiveWords(description);
  return terms.length ? terms[terms.length - 1] : 'item';
}

function withKeywords(result, answers) {
  return {
    ...result,
    destination: 'Registry',
    keywordGroups: buildKeywordGroups(answers),
    searchTerms: buildSearchTerms(answers),
  };
}

function finish(answers, reason) {
  return withKeywords({
    done: true,
    reason,
  }, answers);
}

export function evaluateNext(answers = {}, askedIds = [], structuredCount = 0) {
  const asked = new Set(askedIds);

  if (!asked.has('description')) {
    return withKeywords({
      done: false,
      reason: 'Start with the broad category. The seller can use more than one word if needed.',
      question: createInitialQuestion(),
    }, answers);
  }

  if (structuredCount >= MAX_STRUCTURED_QUESTIONS) {
    return finish(
      answers,
      'The structured-question limit was reached. All collected search terms are retained.',
    );
  }

  const description = clean(answers.description);
  const type = clean(answers.type);
  const feature = clean(answers.feature);
  const currentTerms = [description, type, feature].filter(Boolean).join(' ');

  if (!asked.has('type') && !hasNarrowerType(description)) {
    const category = broadTerm(description);
    return withKeywords({
      done: false,
      step: 'narrower-type',
      reason: 'A broad category is in place. A narrower type will help people find the item.',
      question: question(
        'type',
        'What kind of ' + category + ' is it?',
        'The more specific type or name, if known',
      ),
    }, answers);
  }

  if (!asked.has('feature') && !hasFeatureWords(currentTerms)) {
    return withKeywords({
      done: false,
      step: 'feature',
      reason: 'The category and any narrower type are retained. One useful feature can make the search more precise.',
      question: question(
        'feature',
        'What feature would help someone find this item?',
        'Colour, material, shape, use, condition, or another distinctive detail',
      ),
    }, answers);
  }

  return finish(
    answers,
    'The collected words provide a starting category and, where supplied, a narrower type and feature. Further keywords are optional.',
  );
}

export function getMaxStructuredQuestions() {
  return MAX_STRUCTURED_QUESTIONS;
}

export function isUnknownAnswer(value) {
  return isUnknown(value);
}
