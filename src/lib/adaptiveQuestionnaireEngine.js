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

/*
 * The seller supplies the description. The Sifter owns the classification.
 * "Repeatable manufactured" means the item belongs to a repeatable product/type,
 * whether factory-made or individually built to a recognised repeatable type.
 * "Unique" means the particular object itself is the thing being identified.
 */
const REPEATABLE_PATTERNS = [
  /\b(car|vehicle|van|motorbike|motorcycle|truck|lorry|tractor|bus|scooter|bicycle|bike)\b/i,
  /\b(piano|organ|guitar|drum|keyboard|amplifier|speaker|radio|television|tv|camera|computer|printer|monitor|pedal|echo|reverb|synth|microphone|mixer|turntable)\b/i,
  /\b(machine|machinery|equipment|motor|compressor|generator|conveyor|robot|pump|tool|drill|lathe|wrench|spanner|hammer|saw|vise|vice|appliance|fridge|refrigerator|oven|microwave|washing machine|dishwasher|chair|table|desk|lamp|watch|clock|phone|telephone|part|spare|component|gearbox|alternator|bracket|bearing|switch|valve|nozzle|engine)\b/i,
  /\b(musical equipment|audio equipment|recording equipment|studio equipment|sound equipment)\b/i,
];

const UNIQUE_PATTERNS = [
  /\b(painting|sculpture|artwork|folk art|drawing|photograph|photo|manuscript|letter|diary|one-off|one of a kind|unique|original)\b/i,
  /\b(fag end|cigarette butt|cigarette end|ash|fragment|relic|memorabilia|keepsake)\b/i,
];

function classifyForm(description) {
  const value = text(description);

  if (UNIQUE_PATTERNS.some((pattern) => pattern.test(value))) return 'unique';
  if (REPEATABLE_PATTERNS.some((pattern) => pattern.test(value))) return 'repeatable';

  // Unknown cases are not automatically treated as unique because that can
  // prematurely send ordinary manufactured objects down the wrong path.
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

function nextRepeatableQuestion(answers, askedIds) {
  if (!askedIds.includes('identity')) {
    return question(
      'identity',
      'What is the make and model?',
      'Maker and model, if known'
    );
  }

  if (!askedIds.includes('condition')) {
    return question(
      'condition',
      'Is it working, faulty, incomplete, or otherwise out of service?',
      'Current condition'
    );
  }

  if (!askedIds.includes('partNumber')) {
    return question(
      'partNumber',
      'Is there a serial number, part number, or other identifying number?',
      'Number, or press Enter if unknown'
    );
  }

  if (!askedIds.includes('year')) {
    return question(
      'year',
      'What year or approximate period is it from?',
      'Year or period, if known'
    );
  }

  if (!askedIds.includes('variant')) {
    return question(
      'variant',
      'Is there a version, specification, size, rating, or other variant detail?',
      'Useful identifying specification, if known'
    );
  }

  if (!askedIds.includes('distinctive')) {
    return question(
      'distinctive',
      'Is there any other detail that distinguishes this particular item?',
      'Anything useful for searching or cross-referencing'
    );
  }

  return null;
}

function nextUniqueQuestion(answers, askedIds) {
  const family = classifyFamily([answers.description, answers.clarification].filter(Boolean).join(' '));

  if (family === 'art' && !askedIds.includes('creator')) {
    return question(
      'creator',
      'Who made it?',
      'Artist or maker, if known'
    );
  }

  if (!askedIds.includes('distinctive')) {
    return question(
      'distinctive',
      'What makes this particular object identifiable?',
      'A feature, mark, story, inscription, construction detail, or other distinction'
    );
  }

  if (!askedIds.includes('association')) {
    return question(
      'association',
      'Is it associated with a particular person, place, event, collection, or source?',
      'Association, if known'
    );
  }

  if (!askedIds.includes('origin')) {
    return question(
      'origin',
      'Where did it come from, or where was it found?',
      'Place or source, if known'
    );
  }

  if (!askedIds.includes('period')) {
    return question(
      'period',
      'When is it from, approximately?',
      'Year or period, if known'
    );
  }

  if (!askedIds.includes('medium')) {
    return question(
      'medium',
      'What is it made from or made with?',
      'Material or medium, if useful'
    );
  }

  return null;
}

function repeatableReady(answers) {
  const identity = !isUnknown(answers.identity);
  const condition = !isUnknown(answers.condition);
  return identity && condition;
}

function uniqueReady(answers) {
  const description = meaningfulTokens(answers.description).length > 0;
  const distinguishing = !isUnknown(answers.distinctive)
    || !isUnknown(answers.association)
    || !isUnknown(answers.origin);
  return description && distinguishing;
}

function readinessReason(answers, form) {
  if (form === 'repeatable') {
    if (repeatableReady(answers)) {
      return 'The item has a searchable make/model identity and recorded condition.';
    }
    if (!isUnknown(answers.identity)) {
      return 'The item is identified; its condition is still needed.';
    }
    return 'The repeatable manufactured item still needs its make and model.';
  }

  if (uniqueReady(answers)) {
    return 'The individual object has a searchable description and a distinguishing detail.';
  }

  return 'The individual object still needs enough detail to distinguish it from similar objects.';
}

export function createInitialQuestion() {
  return question(
    'description',
    'Describe your item.',
    'Describe it in your own words'
  );
}

export function evaluateNext(answers, askedIds, structuredCount) {
  let form = classifyForm([answers.description, answers.clarification, answers.formClarification].filter(Boolean).join(' '));

  if (!askedIds.includes('description')) {
    return {
      done: false,
      form: null,
      family: 'general',
      destination: 'Registry',
      reason: 'The seller provides the description; the Sifter determines the interrogation path from it.',
      question: createInitialQuestion(),
    };
  }

  if (!form && !askedIds.includes('clarification')) {
    return {
      done: false,
      form: null,
      family: classifyFamily([answers.description, answers.clarification].filter(Boolean).join(' ')),
      destination: 'Registry',
      reason: 'The description is not yet sufficient to determine the appropriate interrogation path.',
      question: question(
        'clarification',
        'What is the item normally made or used as?',
        'Give its ordinary name or type'
      ),
    };
  }

  if (!form && askedIds.includes('clarification') && !askedIds.includes('formClarification')) {
    return {
      done: false,
      form: null,
      family: classifyFamily([answers.description, answers.clarification].filter(Boolean).join(' ')),
      destination: 'Registry',
      reason: 'The object class is still unclear, so the Sifter asks one focused classification question.',
      question: question(
        'formClarification',
        'Is this a repeatable type of product, or is this particular object a one-off?',
        'e.g. repeatable product / one-off individual object'
      ),
    };
  }

  if (!form && askedIds.includes('formClarification')) {
    const formAnswer = text(answers.formClarification).toLowerCase();
    form = /\b(unique|one[ -]?off|individual|original|bespoke|one of a kind)\b/i.test(formAnswer)
      ? 'unique'
      : 'repeatable';
  }

  if (structuredCount >= MAX_STRUCTURED_QUESTIONS) {
    return {
      done: true,
      form,
      family: classifyFamily([answers.description, answers.clarification].filter(Boolean).join(' ')),
      destination: form === 'repeatable' ? 'Repeatable manufactured items' : 'Individual / unique objects',
      reason: 'The 12-question structured limit has been reached. The information collected is retained as-is.',
    };
  }

  if (form === 'repeatable' && !repeatableReady(answers)) {
    const next = nextRepeatableQuestion(answers, askedIds);
    if (next) {
      return {
        done: false,
        form,
        family: classifyFamily(answers.description),
        destination: 'Repeatable manufactured items',
        reason: readinessReason(answers, form),
        question: next,
      };
    }
  }

  if (form === 'unique' && !uniqueReady(answers)) {
    const next = nextUniqueQuestion(answers, askedIds);
    if (next) {
      return {
        done: false,
        form,
        family: classifyFamily(answers.description),
        destination: 'Individual / unique objects',
        reason: readinessReason(answers, form),
        question: next,
      };
    }
  }

  if (form === 'repeatable' && repeatableReady(answers)) {
    return {
      done: true,
      form,
      family: classifyFamily(answers.description),
      destination: 'Repeatable manufactured items',
      reason: readinessReason(answers, form),
    };
  }

  if (form === 'unique' && uniqueReady(answers)) {
    return {
      done: true,
      form,
      family: classifyFamily(answers.description),
      destination: 'Individual / unique objects',
      reason: readinessReason(answers, form),
    };
  }

  if (structuredCount >= MAX_STRUCTURED_QUESTIONS) {
    return {
      done: true,
      form,
      family: classifyFamily(answers.description),
      destination: form === 'repeatable' ? 'Repeatable manufactured items' : 'Individual / unique objects',
      reason: 'The 12-question structured limit has been reached. The information collected is retained as-is.',
    };
  }

  return {
    done: true,
    form,
    family: classifyFamily(answers.description),
    destination: form === 'repeatable' ? 'Repeatable manufactured items' : 'Individual / unique objects',
    reason: 'No additional useful structured question remains.',
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
