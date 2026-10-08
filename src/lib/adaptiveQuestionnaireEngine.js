const MAX_STRUCTURED_QUESTIONS = 12;

const STOP_WORDS = new Set([
  'a','an','the','and','or','of','for','with','in','on','to','from','by',
  'item','thing','object','stuff','old','used','broken','unknown','something',
  'this','that','it','my','your','some'
]);

const PROFILES = {
  vehicle: {
    destination: 'Vehicles',
    prompts: [
      ['identity', 'What make, model, or identifying name is it?', 'e.g. Audi GT Coupe'],
      ['year', 'What year or approximate period is it from?', 'Year or period, if known'],
      ['variant', 'Is there a model, engine, part, or version detail that distinguishes it?', 'Any identifying detail, if known'],
      ['condition', 'What is its current state?', 'e.g. Running, not running, restoration'],
      ['distinctive', 'What is the most distinctive identifying feature?', 'A feature someone could search for'],
      ['colour', 'What colour is it?', 'Colour, if useful'],
    ],
  },
  machine: {
    destination: 'Machines and equipment',
    prompts: [
      ['identity', 'Who made it, and what is its model or identifying name?', 'Maker, model, or name, if known'],
      ['partNumber', 'Is there a model, serial, or part number?', 'Enter a number or skip if unknown'],
      ['function', 'What does it do, or what machine does it belong to?', 'Its function or associated machine'],
      ['year', 'What year or approximate period is it from?', 'Year or period, if known'],
      ['condition', 'What is its current state?', 'e.g. Working, faulty, incomplete'],
      ['distinctive', 'What detail would distinguish it from similar items?', 'A unique feature, specification, or mark'],
    ],
  },
  part: {
    destination: 'Parts and components',
    prompts: [
      ['fitment', 'What machine, vehicle, or product does it fit?', 'Make, model, or parent machine, if known'],
      ['identity', 'What is the part called, or what does it do?', 'Part name or function'],
      ['partNumber', 'Is there a part number, casting number, or maker mark?', 'Enter the marking or skip if unknown'],
      ['condition', 'What is its current state?', 'e.g. New old stock, used, damaged'],
      ['distinctive', 'What feature helps identify the exact part?', 'Dimensions, connector, shape, or marking'],
    ],
  },
  art: {
    destination: 'Art and creative works',
    prompts: [
      ['artist', 'Who made the work?', 'Artist or maker, if known'],
      ['workTitle', 'Does it have a title or identifying name?', 'Title, if known'],
      ['medium', 'What is it made with or made from?', 'e.g. Oil on canvas, bronze, screen print'],
      ['originality', 'Is it an original, a print, or a reproduction?', 'If known'],
      ['year', 'When was it made, approximately?', 'Year or period, if known'],
      ['distinctive', 'What visible or documented detail distinguishes it?', 'Signature, edition, subject, or other detail'],
    ],
  },
  collectible: {
    destination: 'Collectables and memorabilia',
    prompts: [
      ['identity', 'Who made it, or what is its identifying name or edition?', 'Maker, title, series, or edition'],
      ['date', 'When is it from?', 'Year or period, if known'],
      ['association', 'What person, place, event, series, or subject is it associated with?', 'Association, if known'],
      ['distinctive', 'What detail distinguishes this example from similar ones?', 'Mark, number, wording, or unusual feature'],
      ['condition', 'What is its current state?', 'Condition, if relevant'],
    ],
  },
  document: {
    destination: 'Books, documents and printed material',
    prompts: [
      ['identity', 'What is the title, author, publisher, or identifying name?', 'Any title or identifying wording'],
      ['date', 'When was it published or created?', 'Year or period, if known'],
      ['edition', 'Is there an edition, issue, volume, or reference number?', 'If shown'],
      ['distinctive', 'What makes this copy or document distinctive?', 'Signature, stamp, provenance, or unusual detail'],
      ['condition', 'What is its current state?', 'Condition, if relevant'],
    ],
  },
  electronics: {
    destination: 'Electronics and electrical equipment',
    prompts: [
      ['identity', 'Who made it, and what is its model or identifying name?', 'Maker and model, if known'],
      ['partNumber', 'Is there a model, serial, or part number?', 'Enter the marking or skip if unknown'],
      ['function', 'What does it do or connect to?', 'Function or compatible equipment'],
      ['condition', 'Does it work, partly work, or not work?', 'State, if known'],
      ['distinctive', 'What connector, rating, specification, or feature identifies it?', 'Any identifying detail'],
    ],
  },
  tool: {
    destination: 'Tools and workshop equipment',
    prompts: [
      ['identity', 'Who made it, or what is its model or type?', 'Maker, model, or tool type'],
      ['function', 'What is it designed to do?', 'Its function'],
      ['size', 'Is there a size, rating, or specification?', 'Specification, if known'],
      ['condition', 'What is its current state?', 'Condition, if relevant'],
      ['distinctive', 'What detail distinguishes it from similar tools?', 'Marking, feature, or model detail'],
    ],
  },
  unusual: {
    destination: 'And now for something completely different.',
    prompts: [
      ['identity', 'What is it, or what was it used for?', 'Your best description, even if uncertain'],
      ['distinctive', 'What makes this particular item unusual or identifiable?', 'A feature, mark, story, or detail'],
      ['association', 'What person, place, machine, or event is it associated with?', 'If known'],
      ['origin', 'Where did it come from, or where was it found?', 'Place or source, if known'],
      ['period', 'When is it from, approximately?', 'Year or period, if known'],
      ['context', 'What else would help someone recognise or search for it?', 'Any useful identifying context'],
    ],
  },
};

const TYPE_RULES = [
  ['vehicle', /\b(car|vehicle|van|motorbike|motorcycle|truck|lorry|tractor|bus|scooter|bicycle|bike)\b/i],
  ['part', /\b(part|spare|component|carburettor|carburetor|gearbox|alternator|bracket|bearing|switch|valve|nozzle|pump|engine block)\b/i],
  ['art', /\b(art|painting|sculpture|print|drawing|photograph|photo|canvas|etching|lithograph|artwork)\b/i],
  ['document', /\b(book|document|letter|manuscript|magazine|newspaper|map|poster|pamphlet|comic|catalogue|catalog)\b/i],
  ['electronics', /\b(electronic|electronics|radio|amplifier|speaker|computer|circuit|pcb|television|tv|monitor|camera|charger|power supply)\b/i],
  ['tool', /\b(tool|drill|lathe|wrench|spanner|hammer|saw|vise|vice|workshop)\b/i],
  ['collectible', /\b(collectable|collectible|memorabilia|toy|model|badge|medal|coin|stamp|record|vinyl|figurine|autograph|relic)\b/i],
  ['machine', /\b(machine|machinery|industrial|motor|compressor|generator|conveyor|pump|robot|equipment)\b/i],
];

function text(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function tokens(value) {
  return text(value).toLowerCase().match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g) || [];
}

function isUnknown(value) {
  return !text(value) || /^(?:don't know|do not know|unknown|not sure|unsure|n\/a|na|skip|-)$/i.test(text(value));
}

function meaningfulTokens(value) {
  return tokens(value).filter(token => !STOP_WORDS.has(token));
}

function classify(answers) {
  const source = [answers.type, answers.description].filter(Boolean).join(' ');
  for (const [profile, pattern] of TYPE_RULES) {
    if (pattern.test(source)) return profile;
  }
  return 'unusual';
}

function getIdentityStrength(profile, answers) {
  const description = meaningfulTokens(answers.description || '');
  const typeTokens = new Set(meaningfulTokens(answers.type || ''));
  const specific = description.filter(token => !typeTokens.has(token));
  const knownSpecificAnswer = ['identity','artist','workTitle','partNumber','fitment','association']
    .some(key => !isUnknown(answers[key]));
  const namedIdentity = specific.length >= 2 || knownSpecificAnswer;
  const contextualIdentity = ['distinctive','function','use','origin','context','association']
    .some(key => !isUnknown(answers[key]));

  if (profile === 'vehicle') return { ready: namedIdentity, reason: namedIdentity ? 'The description identifies a searchable vehicle or model.' : 'The description still needs a make, model, or other identifying name.' };
  if (profile === 'art') {
    const namedWork = !isUnknown(answers.artist) || !isUnknown(answers.workTitle) || specific.length >= 2;
    return { ready: namedWork, reason: namedWork ? 'The work has a searchable name, artist, or descriptive identity.' : 'The work still needs a searchable artist, title, or distinguishing description.' };
  }
  if (profile === 'part') {
    const parentOrNumber = !isUnknown(answers.fitment) || !isUnknown(answers.partNumber);
    return { ready: (namedIdentity || parentOrNumber) && (contextualIdentity || specific.length >= 2), reason: (namedIdentity || parentOrNumber) && (contextualIdentity || specific.length >= 2) ? 'The part has an identifying name and a useful distinguishing hook.' : 'The part still needs a name, fitment, number, or distinguishing feature.' };
  }
  if (profile === 'machine' || profile === 'electronics' || profile === 'tool') {
    const modelOrMaker = !isUnknown(answers.identity) || !isUnknown(answers.partNumber);
    const namedDescription = specific.length >= 2;
    return { ready: modelOrMaker || namedDescription, reason: modelOrMaker || namedDescription ? 'The machine or equipment has a searchable identity.' : 'The machine still needs a maker, model, type, or distinctive specification.' };
  }
  if (profile === 'document') {
    const namedDocument = !isUnknown(answers.identity) || specific.length >= 2;
    return { ready: namedDocument, reason: namedDocument ? 'The publication or document has a searchable identity.' : 'The document still needs a title, author, or identifying wording.' };
  }
  if (profile === 'collectible') {
    const namedCollectible = !isUnknown(answers.identity) || !isUnknown(answers.association) || specific.length >= 2;
    return { ready: namedCollectible, reason: namedCollectible ? 'The item has a searchable name or association.' : 'The item still needs a name, series, association, or distinctive feature.' };
  }
  const hasDistinctiveHook = !isUnknown(answers.distinctive) || !isUnknown(answers.association) || !isUnknown(answers.origin) || !isUnknown(answers.context);
  const descriptionNotJustType = specific.length > 0;
  return {
    ready: (descriptionNotJustType && hasDistinctiveHook) || (!isUnknown(answers.use) && !isUnknown(answers.distinctive)),
    reason: ((descriptionNotJustType && hasDistinctiveHook) || (!isUnknown(answers.use) && !isUnknown(answers.distinctive)))
      ? 'The unusual item has a searchable description plus a distinguishing or contextual detail.'
      : 'The unusual item needs one detail that distinguishes it from other items.',
  };
}

function chooseNextQuestion(profile, answers, asked) {
  const available = PROFILES[profile].prompts.filter(([id]) => !asked.includes(id));
  if (!available.length) return null;

  const knownIdentity = ['identity','artist','workTitle','partNumber','fitment','association','use','distinctive']
    .some(key => !isUnknown(answers[key]));
  const knownDescription = meaningfulTokens(answers.description || '').length > 0;

  // Prefer the question that adds the most searchable identity; only then ask context or condition.
  const identityFirst = new Set(['identity','artist','workTitle','partNumber','fitment','function','use','distinctive','association']);
  const identityQuestion = available.find(([id]) => identityFirst.has(id));
  if (!knownIdentity && identityQuestion) return identityQuestion;
  if (!knownDescription && identityQuestion) return identityQuestion;
  return available[0];
}

export function createInitialQuestion() {
  return {
    id: 'type',
    label: 'Describe what your item is in ONE word.',
    placeholder: 'e.g. Car, Painting, Machine, Book',
  };
}

export function evaluateNext(answers, askedIds, structuredCount) {
  const profile = classify(answers);
  const identity = getIdentityStrength(profile, answers);
  if (identity.ready) return { done: true, profile, destination: PROFILES[profile].destination, reason: identity.reason };
  if (structuredCount >= MAX_STRUCTURED_QUESTIONS) {
    return { done: true, profile, destination: PROFILES[profile].destination, reason: 'The 12-question structured limit has been reached. The information collected is retained as-is.' };
  }
  const next = chooseNextQuestion(profile, answers, askedIds);
  if (!next) return { done: true, profile, destination: PROFILES[profile].destination, reason: 'No new useful structured question remains. The information collected is retained as-is.' };
  return {
    done: false,
    profile,
    destination: PROFILES[profile].destination,
    reason: identity.reason,
    question: { id: next[0], label: next[1], placeholder: next[2] },
  };
}

export function getProfileName(profile) {
  return PROFILES[profile]?.destination || PROFILES.unusual.destination;
}

export function getMaxStructuredQuestions() {
  return MAX_STRUCTURED_QUESTIONS;
}

export function isUnknownAnswer(value) {
  return isUnknown(value);
}
