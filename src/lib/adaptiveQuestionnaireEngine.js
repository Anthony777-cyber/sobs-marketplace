const MAX_STRUCTURED_QUESTIONS = 12;

const STOP_WORDS = new Set([
  'a','an','the','and','or','of','for','with','in','on','to','from','by',
  'item','thing','object','stuff','old','used','broken','unknown','something',
  'this','that','it','my','your','some'
]);

function text(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function tokens(value) {
  return text(value).toLowerCase().match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g) || [];
}

function meaningfulTokens(value) {
  return tokens(value).filter((token) => !STOP_WORDS.has(token));
}

function isUnknown(value) {
  return !text(value) || /^(?:don't know|do not know|unknown|not sure|unsure|n\/a|na|skip|-)$/i.test(text(value));
}

function hasAnswer(answers, key) {
  return !isUnknown(answers[key]);
}

/*
 * The Sifter does not ask the seller to choose the branch.
 * It reads the seller's description and forms a working hypothesis:
 *
 *   repeatable manufactured type
 *   individual / unique object
 *
 * The hypothesis drives the question family. Every answer is then used to
 * reduce the remaining uncertainty. Once the registry identity is strong
 * enough, the Sifter closes itself instead of continuing through a checklist.
 */
const REPEATABLE_SIGNALS = [
  /\b(car|vehicle|van|motorbike|motorcycle|truck|lorry|tractor|bus|scooter|bicycle|bike)\b/i,
  /\b(machine|machinery|equipment|motor|compressor|generator|conveyor|robot|pump|tool|drill|lathe|wrench|spanner|hammer|saw|vise|vice|appliance|fridge|refrigerator|oven|microwave|washing machine|dishwasher)\b/i,
  /\b(piano|organ|guitar|drum|keyboard|amplifier|speaker|radio|television|tv|camera|computer|printer|monitor|charger|pedal|echo|reverb|synth|microphone|mixer|turntable)\b/i,
  /\b(musical equipment|audio equipment|recording equipment|studio equipment|sound equipment)\b/i,
  /\b(part|spare|component|gearbox|alternator|bracket|bearing|switch|valve|nozzle|engine)\b/i,
  /\b(model|serial|part number|catalogue|catalog|production|edition|series|mk\.?\s*[ivx0-9]+)\b/i,
  /\b[A-Z]{1,6}[- ]?\d{2,}[A-Z]?\b/,
];

const UNIQUE_SIGNALS = [
  /\b(painting|sculpture|artwork|drawing|photograph|photo|folk art)\b/i,
  /\b(one[- ]off|one of a kind|unique|original|personal object)\b/i,
  /\b(fag end|cigarette butt|cigarette end|fragment|relic|keepsake)\b/i,
];

function classifyForm(description) {
  const value = text(description);

  const uniqueHits = UNIQUE_SIGNALS.filter((pattern) => pattern.test(value)).length;
  const repeatableHits = REPEATABLE_SIGNALS.filter((pattern) => pattern.test(value)).length;

  if (uniqueHits > repeatableHits && uniqueHits > 0) return 'unique';
  if (repeatableHits > 0) return 'repeatable';
  return null;
}

function classifyFamily(description) {
  const value = text(description);

  if (/\b(painting|sculpture|artwork|drawing|photograph|photo|folk art)\b/i.test(value)) return 'art';
  if (/\b(book|document|letter|diary|manuscript|magazine|newspaper|map|poster|pamphlet|comic)\b/i.test(value)) return 'document';
  if (/\b(memorabilia|keepsake|relic|collectible|collectable|badge|medal|coin|stamp|toy|figurine)\b/i.test(value)) return 'collectible';
  if (/\b(part|spare|component|gearbox|alternator|bracket|bearing|switch|valve|nozzle)\b/i.test(value)) return 'part';
  return 'general';
}

function question(id, label, placeholder) {
  return { id, label, placeholder };
}

function descriptionAlreadyIdentifiesRepeatable(answers) {
  const value = text(answers.description);
  const words = meaningfulTokens(value);

  const hasModelLikeCode = /\b[A-Z]{1,6}[- ]?\d{2,}[A-Z]?\b/i.test(value);
  const hasMakerModelLanguage = /\b(by|made by|from|model|mk\.?|mark)\b/i.test(value);

  return words.length >= 3 && (hasModelLikeCode || hasMakerModelLanguage);
}

function descriptionAlreadyIdentifiesUnique(answers) {
  return meaningfulTokens(answers.description).length >= 4;
}

function nextRepeatableQuestion(answers, askedIds) {
  if (!askedIds.includes('identity') && !descriptionAlreadyIdentifiesRepeatable(answers)) {
    return {
      question: question(
        'identity',
        'What is the make and model?',
        'Maker and model, if known'
      ),
      value: 'identity',
      priority: 100,
    };
  }

  if (!askedIds.includes('condition')) {
    return {
      question: question(
        'condition',
        'What is its condition?',
        'e.g. Working, faulty, incomplete, damaged, restored'
      ),
      value: 'condition',
      priority: 60,
    };
  }

  if (!askedIds.includes('partNumber')) {
    return {
      question: question(
        'partNumber',
        'Is there a serial number, part number, or other identifying number?',
        'Number, or press Enter if unknown'
      ),
      value: 'partNumber',
      priority: 90,
    };
  }

  if (!askedIds.includes('year')) {
    return {
      question: question(
        'year',
        'What year or approximate period is it from?',
        'Year or period, if known'
      ),
      value: 'year',
      priority: 70,
    };
  }

  if (!askedIds.includes('variant')) {
    return {
      question: question(
        'variant',
        'Is there a version, specification, size, rating, or other identifying detail?',
        'Useful specification, if known'
      ),
      value: 'variant',
      priority: 80,
    };
  }

  if (!askedIds.includes('distinctive')) {
    return {
      question: question(
        'distinctive',
        'Is there any other detail that distinguishes this particular item?',
        'Anything useful for searching or cross-referencing'
      ),
      value: 'distinctive',
      priority: 50,
    };
  }

  return null;
}

function nextUniqueQuestion(answers, askedIds) {
  const family = classifyFamily(answers.description);

  if (family === 'art' && !askedIds.includes('creator')) {
    return {
      question: question(
        'creator',
        'Who made it?',
        'Artist or maker, if known'
      ),
      value: 'creator',
      priority: 100,
    };
  }

  if (!askedIds.includes('distinctive')) {
    return {
      question: question(
        'distinctive',
        'What makes this particular object identifiable?',
        'A feature, mark, story, inscription, construction detail, or other distinction'
      ),
      value: 'distinctive',
      priority: 100,
    };
  }

  if (!askedIds.includes('association')) {
    return {
      question: question(
        'association',
        'Is it associated with a particular person, place, event, collection, or source?',
        'Association, if known'
      ),
      value: 'association',
      priority: 80,
    };
  }

  if (!askedIds.includes('origin')) {
    return {
      question: question(
        'origin',
        'Where did it come from, or where was it found?',
        'Place or source, if known'
      ),
      value: 'origin',
      priority: 70,
    };
  }

  if (!askedIds.includes('period')) {
    return {
      question: question(
        'period',
        'When is it from, approximately?',
        'Year or period, if known'
      ),
      value: 'period',
      priority: 60,
    };
  }

  if (!askedIds.includes('medium')) {
    return {
      question: question(
        'medium',
        'What is it made from or made with?',
        'Material or medium, if useful'
      ),
      value: 'medium',
      priority: 50,
    };
  }

  return null;
}

function repeatableIdentityReady(answers) {
  const descriptionSpecific = meaningfulTokens(answers.description).length >= 3;
  const suppliedIdentity = hasAnswer(answers, 'identity');
  const suppliedNumber = hasAnswer(answers, 'partNumber');

  return descriptionAlreadyIdentifiesRepeatable(answers)
    || suppliedIdentity
    || suppliedNumber
    || descriptionSpecific && hasAnswer(answers, 'variant');
}

function uniqueIdentityReady(answers) {
  const descriptionSpecific = descriptionAlreadyIdentifiesUnique(answers);
  const creator = hasAnswer(answers, 'creator');
  const distinctive = hasAnswer(answers, 'distinctive');
  const association = hasAnswer(answers, 'association');
  const origin = hasAnswer(answers, 'origin');

  return (descriptionSpecific && distinctive)
    || (creator && (distinctive || association || origin));
}

function readinessReason(answers, form) {
  if (form === 'repeatable') {
    if (repeatableIdentityReady(answers)) {
      return 'The Sifter has enough identifying information to close the registry interrogation.';
    }

    if (hasAnswer(answers, 'identity') || hasAnswer(answers, 'partNumber')) {
      return 'The item has an identifying lead; the Sifter is checking for anything still needed to close the identity.';
    }

    return 'The Sifter is still reducing uncertainty around the manufactured item identity.';
  }

  if (uniqueIdentityReady(answers)) {
    return 'The Sifter has enough identifying and distinguishing information to close the registry interrogation.';
  }

  return 'The Sifter is still reducing uncertainty around the individual object.';
}

export function createInitialQuestion() {
  return question(
    'description',
    'Describe your item.',
    'Describe it in your own words'
  );
}

export function evaluateNext(answers, askedIds, structuredCount) {
  if (!askedIds.includes('description')) {
    return {
      done: false,
      form: null,
      family: 'general',
      destination: 'Registry',
      reason: 'The seller supplies the description. The Sifter determines the interrogation path from it.',
      question: createInitialQuestion(),
    };
  }

  if (structuredCount >= MAX_STRUCTURED_QUESTIONS) {
    return {
      done: true,
      form: classifyForm(answers.description),
      family: classifyFamily(answers.description),
      destination: 'Registry',
      reason: 'The 12-question structured limit has been reached. The information collected is retained as-is.',
    };
  }

  const form = classifyForm(answers.description);

  if (!form) {
    return {
      done: false,
      form: null,
      family: classifyFamily(answers.description),
      destination: 'Registry',
      reason: 'The Sifter cannot yet determine the most useful interrogation path.',
      question: question(
        'clarification',
        'What is this item normally called or used as?',
        'Give its ordinary name or type'
      ),
    };
  }

  const family = classifyFamily(answers.description);
  const destination = form === 'repeatable'
    ? 'Repeatable manufactured items'
    : 'Individual / unique objects';

  const ready = form === 'repeatable'
    ? repeatableIdentityReady(answers)
    : uniqueIdentityReady(answers);

  if (ready) {
    return {
      done: true,
      form,
      family,
      destination,
      reason: readinessReason(answers, form),
    };
  }

  let candidate = form === 'repeatable'
    ? nextRepeatableQuestion(answers, askedIds)
    : nextUniqueQuestion(answers, askedIds);

  if (!candidate && !askedIds.includes('context')) {
    candidate = {
      question: question(
        'context',
        'What else would help someone recognise or search for this item?',
        'Any useful identifying context'
      ),
      value: 'context',
      priority: 40,
    };
  }

  if (!candidate) {
    return {
      done: true,
      form,
      family,
      destination,
      reason: 'No further question offers enough value to justify continuing. The Sifter closes the interrogation.',
    };
  }

  return {
    done: false,
    form,
    family,
    destination,
    reason: readinessReason(answers, form),
    question: candidate.question,
    priority: candidate.priority,
  };
}

export function getProfileName(profile) {
  return profile || 'Registry';
}

export function getMaxStructuredQuestions() {
  return MAX_STRUCTURED_QUESTIONS;
}

export function isUnknownAnswer(value) {
  return isUnknown(value);
}
