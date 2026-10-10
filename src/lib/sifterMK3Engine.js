const MAX_STRUCTURED_QUESTIONS = 12;
const STOP = new Set(['a','an','the','and','or','of','for','with','in','on','to','from','by','it','is','this','that','my','your','used','kind','type']);
const FEATURES = new Set(['black','white','red','blue','green','yellow','orange','purple','pink','brown','grey','gray','silver','gold','beige','cream','wood','wooden','metal','steel','plastic','glass','ceramic','leather','fabric','cotton','wool','working','faulty','broken','damaged','incomplete','restored','refurbished','new','used','worn','tested','untested','old','vintage','antique','modern','retro','rare','large','small','tall','short','wide','narrow','heavy','lightweight','round','square','oval','folding','adjustable','portable','electric','manual','automatic','indoor','outdoor','left','right','pair','set']);
const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
const tokens = value => clean(value).toLowerCase().match(/[a-z0-9]+(?:[-'][a-z0-9]+)*/g) || [];
const unknown = value => !clean(value) || /^(?:don't know|do not know|unknown|not sure|unsure|n\/a|na|skip|-)$/i.test(clean(value));
const fields = [['description','What it is'],['type','Narrower type'],['feature','Feature / distinguishing detail'],['identification','Other identifying details'],['make','Make'],['model','Model'],['year','Year'],['partNumber','Part number'],['variant','Variant / trim'],['mileage','Mileage'],['fuelType','Fuel type'],['transmission','Transmission'],['colour','Colour'],['runningOperating','Running / operating'],['machineDescription','Seller description'],['freeform','Anything else to add']];
export function getMaxStructuredQuestions(){return MAX_STRUCTURED_QUESTIONS;}
export function buildKeywordGroups(answers = {}, routeKeywords = []) {
 const groups=[],seen=new Set(); const add=(id,label,value)=>{const v=clean(value),k=v.toLowerCase();if(!v||unknown(v)||seen.has(k))return;seen.add(k);groups.push({id,label,value:v});};
 routeKeywords.forEach((term,i)=>add('route-'+i,'Listing route keyword',term));
 fields.forEach(([id,label])=>add(id,label,answers[id])); return groups;
}
export function buildSearchTerms(answers = {}, routeKeywords = []) {
 const result=[],seen=new Set();const add=value=>{const v=clean(value),k=v.toLowerCase();if(!v||unknown(v)||seen.has(k))return;seen.add(k);result.push(v);};
 for(const group of buildKeywordGroups(answers,routeKeywords)){const value=clean(group.value).replace(/\b(?:this is|it is|it was|known as)\b/gi,' ').replace(/\s+/g,' ').trim();add(value);for(const word of tokens(value))if(!STOP.has(word))add(word);}return result;
}
export function getNextGeneralQuestion(answers = {}, askedIds = [], structuredCount = 0) {
 const asked=new Set(askedIds);if(structuredCount>=MAX_STRUCTURED_QUESTIONS)return {done:true,reason:'The 12-question hard limit has been reached.'};
 const description=clean(answers.description),identity=[description,clean(answers.type)].filter(Boolean).join(' ');
 const identityWords=[...new Set(tokens(identity).filter(w=>!STOP.has(w)&&!FEATURES.has(w)))];
 if(!asked.has('type')&&identityWords.length<2)return {done:false,reason:'A more specific type may help buyers find the item.',question:{id:'type',label:description?'What kind of '+description+' is it?':'What kind of item is it?',placeholder:'The more specific type or name, if known'}};
 const hasFeature=!unknown(answers.feature)||tokens(identity).some(w=>FEATURES.has(w))||/\b(?:19|20)\d{2}s?\b|\b\d{2,}\b/i.test(identity);
 if(!asked.has('feature')&&!hasFeature)return {done:false,reason:'One useful feature may make the item easier to find.',question:{id:'feature',label:'What feature or detail would help someone find this item?',placeholder:'Colour, material, size, use, condition, age, shape, or another useful detail'}};
 return {done:true,reason:'Enough descriptive information has been collected. Further keywords are optional.'};
}
