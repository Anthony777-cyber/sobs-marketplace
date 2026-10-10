const MAX_STRUCTURED_QUESTIONS = 12;

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'for', 'with', 'in', 'on', 'to',
  'from', 'by', 'it', 'is', 'this', 'that', 'my', 'your', 'normally',
  'called', 'used', 'kind', 'type', 'yes', 'no',
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
  return clean(value).toLowerCase().match(/[a-z0-9]+(?:[-'][a-z0-9]+)*/g) || [];
}

function isUnknown(value) {
  return !clean(value)
    || /^(?:don't know|do not know|unknown|not sure|unsure|n\/a|na|skip|-)$/i.test(clean(value));
}

function question(id, label, placeholder) {
  return { id, label, placeholder };
}

function cleanSearchText(value) {
  return clean(value)
    .replace(/\b(?:made|manufactured|produced|built)\s+by\b/gi, ' ')
    .replace(/\b(?:this is|it is|it was|known as)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createInitialQuestion() {
  return question('description', 'What is it?', 'Enter the item name or a short description');
}

function allDescriptiveText(answers = {}) {
  return [
    answers.description, answers.type, answers.feature,
    answers.identification, answers.make, answers.model, answers.year,
    answers.partNumber, answers.colour, answers.machineDescription,
    answers.variant, answers.mileage, answers.fuelType, answers.transmission,
    answers.freeform,
  ].map(clean).filter(Boolean).join(' ');
}

function identityTokens(value) {
  return [...new Set(tokens(value).filter((word) =>
    !STOP_WORDS.has(word) && !GENERIC_WORDS.has(word) && !FEATURE_WORDS.has(word)
  ))];
}

function hasSpecificType(answers) {
  return identityTokens([answers.description, answers.type].filter(Boolean).join(' ')).length > 1;
}

function hasFeatureInformation(answers) {
  if (!isUnknown(answers.feature)) return true;
  const words = tokens([answers.description, answers.type].filter(Boolean).join(' '));
  if (words.some((word) => FEATURE_WORDS.has(word))) return true;
  return /\b(?:19|20)\d{2}s?\b|\b\d{2,}\b/i.test(
    [answers.description, answers.type].filter(Boolean).join(' '),
  );
}

function featurePrompt(answers) {
  const text = allDescriptiveText(answers).toLowerCase();

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

export function buildKeywordGroups(answers = {}, routeKeywords = []) {
  const fields = [
    { id: 'description', label: 'What it is' },
    { id: 'type', label: 'Narrower type' },
    { id: 'feature', label: 'Feature / distinguishing detail' },
    { id: 'identification', label: 'Other identifying details' },
    { id: 'make', label: 'Make' },
    { id: 'model', label: 'Model' },
    { id: 'year', label: 'Year' },
    { id: 'partNumber', label: 'Part number' },
    { id: 'variant', label: 'Variant / trim' },
    { id: 'mileage', label: 'Mileage' },
    { id: 'fuelType', label: 'Fuel type' },
    { id: 'transmission', label: 'Transmission' },
    { id: 'colour', label: 'Colour' },
    { id: 'machineDescription', label: 'Seller description' },
    { id: 'freeform', label: 'Anything else to add' },
  ];

  const groups = [];
  const seen = new Set();
  const add = (id, label, value) => {
    const cleaned = clean(value);
    const key = cleaned.toLowerCase();
    if (!cleaned || isUnknown(cleaned) || seen.has(key)) return;
    seen.add(key);
    groups.push({ id, label, value: cleaned });
  };

  routeKeywords.forEach((term, index) => add('route-' + index, 'Listing route keyword', term));
  fields.forEach((field) => add(field.id, field.label, answers[field.id]));
  return groups;
}

export function buildSearchTerms(answers = {}, routeKeywords = []) {
  const result = [];
  const seen = new Set();
  const add = (value) => {
    const term = clean(value);
    const key = term.toLowerCase();
    if (!term || isUnknown(term) || seen.has(key)) return;
    seen.add(key);
    result.push(term);
  };

  for (const group of buildKeywordGroups(answers, routeKeywords)) {
    const value = cleanSearchText(group.value);
    add(value);
    for (const word of tokens(value)) {
      if (!STOP_WORDS.has(word) && !GENERIC_WORDS.has(word)) add(word);
    }
  }
  return result;
}

function withKeywords(result, answers, routeKeywords = []) {
  return {
    ...result,
    destination: 'Test page only — no Registry write is performed',
    keywordGroups: buildKeywordGroups(answers, routeKeywords),
    searchTerms: buildSearchTerms(answers, routeKeywords),
  };
}

function finish(answers, reason, routeKeywords = []) {
  return withKeywords({ done: true, reason }, answers, routeKeywords);
}

export function evaluateNext(answers = {}, askedIds = [], structuredCount = 0, routeKeywords = []) {
  const asked = new Set(askedIds);

  if (!asked.has('description')) {
    return withKeywords({
      done: false,
      reason: 'Start with the item name or description.',
      question: createInitialQuestion(),
    }, answers, routeKeywords);
  }

  if (structuredCount >= MAX_STRUCTURED_QUESTIONS) {
    return finish(answers, 'The 12-question hard limit has been reached.', routeKeywords);
  }

  if (!hasSpecificType(answers) && !asked.has('type')) {
    return withKeywords({
      done: false,
      step: 'narrower-type',
      reason: 'A more specific type may help buyers find the item.',
      question: question(
        'type',
        'What kind of ' + (clean(answers.description) || 'item') + ' is it?',
        'The more specific type or name, if known',
      ),
    }, answers, routeKeywords);
  }

  if (!hasFeatureInformation(answers) && !asked.has('feature')) {
    const prompt = featurePrompt(answers);
    return withKeywords({
      done: false,
      step: 'feature',
      reason: 'One useful feature may make the item easier to find.',
      question: question('feature', prompt.label, prompt.placeholder),
    }, answers, routeKeywords);
  }

  return finish(answers, 'Enough descriptive information has been collected. Further keywords are optional.', routeKeywords);
}

export function getMaxStructuredQuestions() {
  return MAX_STRUCTURED_QUESTIONS;
}
