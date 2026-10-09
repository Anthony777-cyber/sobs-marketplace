const MAX_STRUCTURED_QUESTIONS = 12;

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'for', 'with', 'in', 'on', 'to',
  'from', 'by', 'it', 'is', 'this', 'that', 'my', 'your', 'normally',
  'called', 'used', 'kind', 'type',
]);

const GENERIC_WORDS = new Set([
  'item', 'thing', 'object', 'stuff', 'something',
]);

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
  'heavy', 'lightweight', 'round', 'square', 'oval', 'rectangular',
  'folding', 'adjustable', 'portable', 'electric', 'electrical',
  'manual', 'automatic', 'indoor', 'outdoor', 'left', 'right',
  'single', 'double', 'pair', 'set', 'striped', 'plain', 'patterned',
  '1950s', '1960s', '1970s', '1980s', '1990s', '2000s',
]);

function clean(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function tokens(value) {
  return clean(value).toLowerCase().match(/[a-z0-9]+/g) || [];
}

function isUnknown(value) {
  return !clean(value)
    || /^(?:don't know|do not know|unknown|not sure|unsure|n\/a|na|skip|-)$/i.test(clean(value));
}

function question(id, label, placeholder, options) {
  return { id, label, placeholder, ...(options ? { options } : {}) };
}

function cleanSearchText(value) {
  return clean(value)
    .replace(/\b(?:made|manufactured|produced|built)\s+by\b/gi, ' ')
    .replace(/\b(?:this is|it is|it was|known as)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createCategoryQuestion() {
  return question('category', 'Which best describes it?', 'Choose one', [
    { value: 'machine', label: 'Machine' },
    { value: 'machine_part', label: 'Part of a machine' },
    { value: 'other', label: 'Everything else' },
  ]);
}

function allDescriptiveText(answers = {}) {
  return [
    answers.description,
    answers.type,
    answers.feature,
    answers.identification,
    answers.make,
    answers.model,
    answers.year,
    answers.partNumber,
    answers.colour,
    answers.runningOperating,
    answers.machineDescription,
    answers.freeform,
  ].map(clean).filter(Boolean).join(' ');
}

function identityTokens(value) {
  return [...new Set(tokens(value).filter((word) =>
    !STOP_WORDS.has(word)
    && !GENERIC_WORDS.has(word)
    && !FEATURE_WORDS.has(word)
  ))];
}

function hasSpecificType(answers) {
  return identityTokens([answers.description, answers.type].filter(Boolean).join(' ')).length > 1;
}

function hasFeatureInformation(answers) {
  if (!isUnknown(answers.feature)) return true;

  const words = tokens([answers.description, answers.type].filter(Boolean).join(' '));
  if (words.some((word) => FEATURE_WORDS.has(word))) return true;

  // Dates and identifying numbers are useful searchable details too.
  return /\b(?:19|20)\d{2}s?\b|\b\d{2,}\b/i.test(
    [answers.description, answers.type].filter(Boolean).join(' '),
  );
}

function broadCategory(answers) {
  const categoryText = clean(answers.description);
  const categoryTokens = tokens(categoryText).filter((word) =>
    !STOP_WORDS.has(word)
    && !GENERIC_WORDS.has(word)
    && !FEATURE_WORDS.has(word)
  );
  if (!categoryTokens.length) return 'item';

  const knownCategories = new Set([
    'lamp', 'lamps', 'light', 'lights', 'chair', 'chairs', 'desk', 'table',
    'book', 'books', 'car', 'cars', 'part', 'parts', 'tool', 'tools',
    'machine', 'machines', 'guitar', 'piano', 'radio', 'camera', 'phone',
    'computer', 'speaker', 'amplifier', 'pedal', 'bicycle', 'bike',
    'clothing', 'coat', 'jacket', 'shoe', 'shoes', 'painting', 'sculpture',
    'toy', 'toys', 'record', 'records', 'furniture', 'motor', 'engine',
  ]);

  for (let i = categoryTokens.length - 1; i >= 0; i -= 1) {
    if (knownCategories.has(categoryTokens[i])) return categoryTokens[i];
  }

  return categoryTokens[categoryTokens.length - 1];
}

function featurePrompt(answers) {
  const text = allDescriptiveText(answers).toLowerCase();
  const category = broadCategory(answers);

  if (/\b(lamp|lamps|light|lights|lighting)\b/.test(text)) {
    return {
      label: 'What feature would help someone find this lamp?',
      placeholder: 'Colour, material, style, adjustability, size, or another useful detail',
    };
  }

  if (/\b(book|books|magazine|manual|document|record|records)\b/.test(text)) {
    return {
      label: 'What detail would help someone find this item?',
      placeholder: 'Author, subject, edition, language, year, condition, or another useful detail',
    };
  }

  if (/\b(clothing|coat|jacket|shoe|shoes|dress|shirt|trousers)\b/.test(text)) {
    return {
      label: 'What feature would help someone find this item?',
      placeholder: 'Size, colour, fabric, style, brand, condition, or another useful detail',
    };
  }

  if (/\b(part|spare|component|engine|motor|machine|tool|electronic|electronics|audio|speaker|amplifier|pedal|guitar)\b/.test(text)) {
    return {
      label: 'What detail would help someone find this item?',
      placeholder: 'Function, make, connection, size, material, condition, or another useful detail',
    };
  }

  return {
    label: 'What feature would help someone find this item?',
    placeholder: 'Colour, material, size, use, condition, age, shape, or another useful detail',
  };
}

export function createInitialQuestion() {
  return question(
    'description',
    'What is it in one word?',
    'e.g. lamp, chair, book — more words are okay',
  );
}

export function buildKeywordGroups(answers = {}) {
  const fields = [
    { id: 'description', label: 'What it is' },
    { id: 'type', label: 'Narrower type' },
    { id: 'feature', label: 'Feature / distinguishing detail' },
    { id: 'identification', label: 'Identification and description' },
    { id: 'make', label: 'Make' },
    { id: 'model', label: 'Model' },
    { id: 'year', label: 'Year' },
    { id: 'partNumber', label: 'Part number' },
    { id: 'colour', label: 'Colour' },
    { id: 'runningOperating', label: 'Running / operating' },
    { id: 'machineDescription', label: 'Seller description' },
    { id: 'freeform', label: 'Anything else to add' },
  ];

  return fields
    .map((field) => ({ ...field, value: clean(answers[field.id]) }))
    .filter((field) => field.value && !isUnknown(field.value));
}

export function buildTaxonomyTerms(answers = {}) {
  // Every newly encountered object can contribute taxonomy terms; do not
  // restrict taxonomy creation to a hard-coded list of known categories.
  // Machine objects can be identified by their make, model, and part/identity.
  const candidates = [
    answers.description,
    answers.type,
    answers.make,
    answers.model,
    answers.identification,
    answers.partNumber,
  ];
  const terms = [];
  const seen = new Set();

  for (const candidate of candidates) {
    const term = clean(candidate).toLowerCase();
    if (!term || isUnknown(term) || seen.has(term)) continue;
    seen.add(term);
    terms.push(term);
  }

  return terms;
}

export function buildSearchTerms(answers = {}) {
  const result = [];
  const seen = new Set();

  const add = (value) => {
    const term = clean(value);
    const key = term.toLowerCase();
    if (!term || isUnknown(term) || seen.has(key)) return;
    seen.add(key);
    result.push(term);
  };

  for (const group of buildKeywordGroups(answers)) {
    const searchableValue = cleanSearchText(group.value);
    add(searchableValue);
    for (const word of tokens(searchableValue)) {
      if (!STOP_WORDS.has(word) && !GENERIC_WORDS.has(word)) add(word);
    }
  }

  for (const term of buildTaxonomyTerms(answers)) add(term);

  return result;
}

function withKeywords(result, answers) {
  return {
    ...result,
    destination: 'Test page only — no Registry write is performed',
    keywordGroups: buildKeywordGroups(answers),
    searchTerms: buildSearchTerms(answers),
    taxonomyTerms: buildTaxonomyTerms(answers),
  };
}

function finish(answers, reason) {
  return withKeywords({ done: true, reason }, answers);
}

export function evaluateNext(answers = {}, askedIds = [], structuredCount = 0) {
  const asked = new Set(askedIds);

  if (!asked.has('description')) {
    return withKeywords({
      done: false,
      reason: 'Start with the item name.',
      question: createInitialQuestion(),
    }, answers);
  }

  if (structuredCount >= MAX_STRUCTURED_QUESTIONS) {
    return finish(answers, 'The 12-question hard limit has been reached.');
  }

  if (!asked.has('category')) {
    return withKeywords({
      done: false,
      reason: 'Choose the broad item category.',
      question: createCategoryQuestion(),
    }, answers);
  }

  if (answers.category === 'machine' || answers.category === 'machine_part') {
    if (!asked.has('identification')) {
      return withKeywords({
        done: false,
        reason: 'Collect the identifying details, colour, operating state, and seller description together in one form.',
        question: question(
          'identification',
          'Enter the machine details in the dedicated form.',
          'Complete whichever details you know.',
        ),
      }, answers);
    }
    return finish(answers, 'The identifying details and description have been collected. Further keywords are optional.');
  }

  if (!hasSpecificType(answers) && !asked.has('type')) {
    const category = broadCategory(answers);
    return withKeywords({
      done: false,
      step: 'narrower-type',
      reason: 'A narrower type may help buyers find the item.',
      question: question(
        'type',
        category === 'item' ? 'What kind of item is it?' : 'What kind of ' + category + ' is it?',
        'The more specific type or name, if known',
      ),
    }, answers);
  }

  if (!hasFeatureInformation(answers) && !asked.has('feature')) {
    const prompt = featurePrompt(answers);
    return withKeywords({
      done: false,
      step: 'feature',
      reason: 'One useful feature may make the item easier to find.',
      question: question('feature', prompt.label, prompt.placeholder),
    }, answers);
  }

  return finish(answers, 'Enough descriptive information has been collected. Further keywords are optional.');
}

export function getMaxStructuredQuestions() {
  return MAX_STRUCTURED_QUESTIONS;
}

export function isUnknownAnswer(value) {
  return isUnknown(value);
}
