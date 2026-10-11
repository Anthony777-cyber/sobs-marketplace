const MAX_STRUCTURED_QUESTIONS = 12;
const STOP = new Set(['a','an','the','and','or','of','for','with','in','on','to','from','by','it','is','this','that','my','your','normally','called','used','kind','type']);
const GENERIC_WORDS = new Set(['item','thing','object','stuff','something']);
const FEATURES = new Set([
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
const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
const cleanSearchText = value => clean(value)
 .replace(/\b(?:made|manufactured|produced|built)\s+by\b/gi, ' ')
 .replace(/\b(?:this is|it is|it was|known as)\b/gi, ' ')
 .replace(/\s+/g, ' ')
 .trim();
const tokens = value => clean(value).toLowerCase().match(/[a-z0-9]+/g) || [];
const unknown = value => {
 const normalized = clean(value).toLowerCase().replace(/[’]/g, "'").replace(/[.!?]+$/g, '');
 return !normalized || /^(?:(?:i )?(?:don't know|do not know)|unknown|not sure|unsure|n\/a|na|skip|-)$/i.test(normalized);
};
const fields = [
 ['description','What it is'],
 ['type','Narrower type'],
 ['feature','Feature / distinguishing detail'],
 ['identification','Other identifying details'],
 ['make','Make'],
 ['model','Model'],
 ['year','Year'],
 ['partNumber','Part number'],
 ['variant','Variant / trim'],
 ['mileage','Mileage'],
 ['fuelType','Fuel type'],
 ['transmission','Transmission'],
 ['colour','Colour'],
 ['material','Material'],
 ['dimensions','Dimensions'],
 ['condition','Condition'],
 ['quantity','Quantity'],
 ['capacity','Capacity'],
 ['specifications','Specifications'],
 ['compatibility','Compatibility'],
 ['powerSource','Power source'],
 ['fault','Faults / known issues'],
 ['storage','Storage capacity'],
 ['title','Title / item name'],
 ['author','Author'],
 ['publisher','Publisher / label'],
 ['edition','Edition / issue'],
 ['format','Format'],
 ['artist','Artist / maker'],
 ['platform','Platform'],
 ['completeness','Completeness'],
 ['scale','Scale / model size'],
 ['era','Age / era'],
 ['origin','Origin'],
 ['clothingSize','Clothing / shoe size'],
 ['style','Style'],
 ['movement','Movement / mechanism'],
 ['identifyingMarks','Identifying marks'],
 ['ageRange','Age range'],
 ['accessories','Included accessories'],
 ['sport','Sport / activity'],
 ['size','Size'],
 ['frameSize','Frame size'],
 ['wheelSize','Wheel size'],
 ['length','Length'],
 ['petType','Animal / pet type'],
 ['catalogNumber','Catalogue number'],
 ['denomination','Denomination / issue'],
 ['runningOperating','Running / operating'],
 ['workingStatus','Working status'],
 ['machineDescription','Seller description'],
 ['freeform','Anything else to add'],
];
export function getMaxStructuredQuestions(){return MAX_STRUCTURED_QUESTIONS;}
export function buildKeywordGroups(answers = {}, _routeKeywords = []) {
 const groups=[],seen=new Set();
 const add=(id,label,value)=>{const v=clean(value),k=v.toLowerCase();if(!v||unknown(v)||seen.has(k))return;seen.add(k);groups.push({id,label,value:v});};
 // Route selections control the questionnaire; they are not seller-supplied item keywords.
 fields.forEach(([id,label])=>add(id,label,answers[id]));
 return groups;
}
export function buildSearchTerms(answers = {}, routeKeywords = []) {
 const result=[],seen=new Set();
 const add=value=>{const v=clean(value),k=v.toLowerCase();if(!v||unknown(v)||seen.has(k))return;seen.add(k);result.push(v);};
 for(const group of buildKeywordGroups(answers,routeKeywords)){
  const searchableValue=cleanSearchText(group.value);
  add(searchableValue);
  for(const word of tokens(searchableValue)) if(!STOP.has(word)&&!GENERIC_WORDS.has(word)) add(word);
 }
 return result;
}
export function getNextGeneralQuestion(answers = {}, askedIds = [], structuredCount = 0) {
 const asked=new Set(askedIds);if(structuredCount>=MAX_STRUCTURED_QUESTIONS)return {done:true,reason:'The 12-question hard limit has been reached.'};
 const description=clean(answers.description),identity=[description,clean(answers.type)].filter(Boolean).join(' ');
 const identityWords=[...new Set(tokens(identity).filter(w=>!STOP.has(w)&&!GENERIC_WORDS.has(w)&&!FEATURES.has(w)))];
 if(!asked.has('type')&&identityWords.length<2)return {done:false,reason:'A more specific type may help buyers find the item.',question:{id:'type',label:description?'What kind of '+description+' is it?':'What kind of item is it?',placeholder:'The more specific type or name, if known'}};
 const hasFeature=!unknown(answers.feature)||tokens(identity).some(w=>FEATURES.has(w))||/\b(?:19|20)\d{2}s?\b|\b\d{2,}\b/i.test(identity);
 if(!asked.has('feature')&&!hasFeature)return {done:false,reason:'One useful feature may make the item easier to find.',question:{id:'feature',label:'What feature or detail would help someone find this item?',placeholder:'Colour, material, size, use, condition, age, shape, or another useful detail'}};
 return {done:true,reason:'Enough descriptive information has been collected. Further keywords are optional.'};
}
