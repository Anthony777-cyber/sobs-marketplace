import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildKeywordGroups, buildSearchTerms, getMaxStructuredQuestions, getNextGeneralQuestion } from '../lib/sifterMK4Engine';

const MAX_QUESTIONS = getMaxStructuredQuestions();
const DRAFT_KEY = 'sobs_sifter_mk4_draft';
const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
const EMPTY_MACHINE = { machineClass:'', make:'', model:'', year:'', partNumber:'', otherDetails:'', colour:'', runningOperating:'' };
const EMPTY_CAR = { make:'', model:'', year:'', variant:'', partNumber:'', mileage:'', fuelType:'', transmission:'', colour:'', runningOperating:'', otherDetails:'' };
const FORM_INSTRUCTION = "If you don't know something, don't worry; just leave it blank.";
const LABELS = { description:'What it is', type:'Narrower type', feature:'Feature / distinguishing detail', workingStatus:'Working status' };
const GENERAL_CATEGORIES = [
  'Home, furniture & interiors','Garden & outdoor','Kitchen & dining','DIY, tools & building supplies',
  'Building & renovation materials','Electrical, lighting & wiring','Computers & IT','Phones & telecommunications',
  'TV, audio & home cinema','Cameras, photography & optics','Household appliances','Heating, cooling & ventilation',
  'Plumbing & bathroom','Office equipment','Business, industrial & workshop equipment','Agricultural & farm equipment',
  'Commercial catering & hospitality','Medical, laboratory & test equipment','Books, comics & magazines',
  'Records, CDs, DVDs & media','Musical instruments & stage equipment','Games, consoles & gaming',
  'Toys, games & puzzles','Hobbies, crafts & model making','Art, antiques & collectibles','Coins, stamps & memorabilia',
  'Clothing, shoes & accessories','Jewellery & watches',"Baby & children's items",'Sports, fitness & recreation',
  'Camping, travel & outdoor leisure','Bicycles & cycling','Boats & water sports','Pet supplies',
  'Mobility & accessibility aids','Health & personal care equipment','Packaging, storage & materials',
  'Security & specialist equipment','Other / not sure',
];
const GENERAL_CATEGORY_BUTTON_COLORS = [
  '#1d4ed8','#c2410c','#475569','#6d28d9','#0e7490','#be123c',
  '#854d0e','#a21caf','#4d7c0f','#4338ca','#b45309','#047857',
];
const MACHINE_STATUS_CATEGORIES = new Set([
  'DIY, tools & building supplies',
  'Electrical, lighting & wiring',
  'Computers & IT',
  'Phones & telecommunications',
  'TV, audio & home cinema',
  'Cameras, photography & optics',
  'Household appliances',
  'Heating, cooling & ventilation',
  'Office equipment',
  'Business, industrial & workshop equipment',
  'Agricultural & farm equipment',
  'Commercial catering & hospitality',
  'Medical, laboratory & test equipment',
  'Security & specialist equipment',
]);
const CATEGORY_FIELD_DEFS = {
  type:{label:'Item type',placeholder:'Specific item type or name'},
  make:{label:'Brand / maker',placeholder:'Manufacturer, brand or maker if known'},
  model:{label:'Model',placeholder:'Model or reference if known'},
  year:{label:'Year / date',placeholder:'Year or approximate date if known'},
  partNumber:{label:'Part number / reference',placeholder:'Part number, product code or reference'},
  material:{label:'Material',placeholder:'Material or construction'},
  dimensions:{label:'Dimensions',placeholder:'Measurements, with units'},
  colour:{label:'Colour',placeholder:'Colour if relevant'},
  condition:{label:'Condition',placeholder:'New, used, worn, damaged, incomplete, etc.'},
  quantity:{label:'Quantity',placeholder:'Number available or included'},
  capacity:{label:'Capacity',placeholder:'Capacity or load rating, with units'},
  specifications:{label:'Specifications',placeholder:'Important specifications or technical details'},
  compatibility:{label:'Compatibility',placeholder:'Compatible models, systems or uses'},
  powerSource:{label:'Power source',placeholder:'Mains, battery, petrol, diesel, manual, etc.'},
  fault:{label:'Faults / known issues',placeholder:'Known faults or what does not work'},
  storage:{label:'Storage capacity',placeholder:'Capacity, e.g. GB or TB'},
  title:{label:'Title / item name',placeholder:'Title or name'},
  author:{label:'Author',placeholder:'Author or creator'},
  publisher:{label:'Publisher / label',placeholder:'Publisher, record label or producer'},
  edition:{label:'Edition / issue',placeholder:'Edition, issue, pressing or version'},
  format:{label:'Format',placeholder:'Format or media type'},
  artist:{label:'Artist / maker',placeholder:'Artist, performer or maker'},
  platform:{label:'Platform',placeholder:'Console, system or platform'},
  completeness:{label:'Completeness',placeholder:'Complete, missing parts, sealed, etc.'},
  scale:{label:'Scale / model size',placeholder:'Scale or model size if relevant'},
  era:{label:'Age / era',placeholder:'Approximate age, period or era'},
  origin:{label:'Origin',placeholder:'Country, region or place of origin if known'},
  clothingSize:{label:'Clothing / shoe size',placeholder:'Size and sizing system'},
  style:{label:'Style',placeholder:'Style, cut or design'},
  movement:{label:'Movement / mechanism',placeholder:'Movement or mechanism, if relevant'},
  identifyingMarks:{label:'Identifying marks',placeholder:'Hallmarks, markings, serial or identifying details'},
  ageRange:{label:'Age range',placeholder:'Age range or intended user'},
  accessories:{label:'Included accessories',placeholder:'Included accessories, parts or attachments'},
  sport:{label:'Sport / activity',placeholder:'Sport, activity or intended use'},
  size:{label:'Size',placeholder:'Size, with units or sizing system'},
  frameSize:{label:'Frame size',placeholder:'Frame size and units'},
  wheelSize:{label:'Wheel size',placeholder:'Wheel size, with units'},
  length:{label:'Length',placeholder:'Length and units'},
  petType:{label:'Animal / pet type',placeholder:'Animal, species or intended pet'},
  catalogNumber:{label:'Catalogue number',placeholder:'Catalogue or reference number'},
  denomination:{label:'Denomination / issue',placeholder:'Denomination, face value or issue details'},
};
const CATEGORY_FORM_FIELDS = {
  'Home, furniture & interiors':['type','make','material','dimensions','colour','condition'],
  'Garden & outdoor':['type','make','material','dimensions','powerSource','condition'],
  'Kitchen & dining':['type','make','material','dimensions','capacity','condition'],
  'DIY, tools & building supplies':['type','make','model','partNumber','specifications','compatibility','condition'],
  'Building & renovation materials':['type','material','dimensions','colour','quantity','condition'],
  'Electrical, lighting & wiring':['type','make','model','partNumber','specifications','compatibility','powerSource','condition'],
  'Computers & IT':['type','make','model','year','specifications','storage','compatibility','condition','accessories'],
  'Phones & telecommunications':['type','make','model','year','storage','compatibility','condition','accessories'],
  'TV, audio & home cinema':['type','make','model','year','specifications','compatibility','condition','accessories'],
  'Cameras, photography & optics':['type','make','model','year','specifications','compatibility','condition','accessories'],
  'Household appliances':['type','make','model','year','capacity','powerSource','condition','fault'],
  'Heating, cooling & ventilation':['type','make','model','capacity','powerSource','specifications','condition','fault'],
  'Plumbing & bathroom':['type','make','model','partNumber','material','dimensions','compatibility','condition'],
  'Office equipment':['type','make','model','year','partNumber','dimensions','specifications','condition','accessories'],
  'Business, industrial & workshop equipment':['type','make','model','year','partNumber','specifications','capacity','powerSource','condition','fault'],
  'Agricultural & farm equipment':['type','make','model','year','partNumber','specifications','capacity','condition','fault'],
  'Commercial catering & hospitality':['type','make','model','capacity','dimensions','powerSource','specifications','condition'],
  'Medical, laboratory & test equipment':['type','make','model','partNumber','specifications','capacity','condition','compatibility'],
  'Books, comics & magazines':['title','author','publisher','edition','year','format','condition'],
  'Records, CDs, DVDs & media':['title','artist','publisher','edition','year','format','condition'],
  'Musical instruments & stage equipment':['type','make','model','year','material','specifications','condition','accessories'],
  'Games, consoles & gaming':['title','platform','year','edition','compatibility','condition','accessories'],
  'Toys, games & puzzles':['type','make','ageRange','material','completeness','condition'],
  'Hobbies, crafts & model making':['type','make','model','scale','material','dimensions','completeness','condition'],
  'Art, antiques & collectibles':['type','title','artist','material','era','origin','dimensions','condition'],
  'Coins, stamps & memorabilia':['type','origin','year','denomination','catalogNumber','edition','condition'],
  'Clothing, shoes & accessories':['type','make','clothingSize','material','colour','style','condition'],
  'Jewellery & watches':['type','make','material','dimensions','movement','identifyingMarks','condition'],
  "Baby & children's items":['type','make','ageRange','dimensions','material','condition','completeness'],
  'Sports, fitness & recreation':['type','make','model','sport','size','specifications','condition','accessories'],
  'Camping, travel & outdoor leisure':['type','make','model','capacity','dimensions','material','condition','accessories'],
  'Bicycles & cycling':['type','make','model','year','frameSize','wheelSize','partNumber','condition','accessories'],
  'Boats & water sports':['type','make','model','year','length','capacity','material','powerSource','condition','accessories'],
  'Pet supplies':['type','make','petType','dimensions','material','condition'],
  'Mobility & accessibility aids':['type','make','model','dimensions','capacity','condition','accessories'],
  'Health & personal care equipment':['type','make','model','partNumber','specifications','dimensions','condition','accessories'],
  'Packaging, storage & materials':['type','material','dimensions','capacity','quantity','condition'],
  'Security & specialist equipment':['type','make','model','partNumber','specifications','compatibility','powerSource','condition'],
};

export default function SifterMK4({ customerMode = false, onContinue }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [route, setRoute] = useState('');
  const [routeKeywords, setRouteKeywords] = useState([]);
  const [answers, setAnswers] = useState({});
  const [askedIds, setAskedIds] = useState([]);
  const [structuredCount, setStructuredCount] = useState(0);
  const [current, setCurrent] = useState({ id:'description', label:'What is it?', placeholder:'Enter the item name or a short description' });
  const [phase, setPhase] = useState('route');
  const [input, setInput] = useState('');
  const [machineDetails, setMachineDetails] = useState(EMPTY_MACHINE);
  const [carDetails, setCarDetails] = useState(EMPTY_CAR);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [taxonomy, setTaxonomy] = useState(null);
  const [categoryDetails, setCategoryDetails] = useState({});
  const [decision, setDecision] = useState(null);
  const [diagnosticLog, setDiagnosticLog] = useState([]);
  const [history, setHistory] = useState([]);
  const [copyStatus, setCopyStatus] = useState('');
  const [draftReady, setDraftReady] = useState(!customerMode);

  useEffect(() => {
    if (!customerMode) return;
    const startFresh = new URLSearchParams(location.search).has('fresh');
    if (startFresh) {
      skipDraftSaveOnce.current = true;
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      setRoute('');
      setRouteKeywords([]);
      setAnswers({});
      setAskedIds([]);
      setStructuredCount(0);
      setCurrent({ id:'description', label:'What is it?', placeholder:'Enter the item name or a short description' });
      setPhase('route');
      setInput('');
      setMachineDetails(EMPTY_MACHINE);
      setCarDetails(EMPTY_CAR);
      setSelectedCategory('');
      setTaxonomy(null);
      setCategoryDetails({});
      setDecision(null);
      setDiagnosticLog([]);
      setHistory([]);
      setCopyStatus('');
      navigate('/sifter-mk4', { replace: true });
      return;
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setRoute(saved.route || ''); setRouteKeywords(saved.routeKeywords || []); setAnswers(saved.answers || {});
        setAskedIds(saved.askedIds || []); setStructuredCount(saved.structuredCount || 0);
        setCurrent(saved.current || {id:'description',label:'What is it?',placeholder:'Enter the item name or a short description'});
        setPhase(saved.phase || 'route'); setInput(saved.input || '');
        setMachineDetails(saved.machineDetails || EMPTY_MACHINE); setCarDetails(saved.carDetails || EMPTY_CAR);
        setSelectedCategory(saved.selectedCategory || ''); setTaxonomy(saved.taxonomy || null);
        setCategoryDetails(saved.categoryDetails || {}); setDecision(saved.decision || null);
        setDiagnosticLog(saved.diagnosticLog || []); setHistory(saved.history || []);
      }
    } catch {}
    setDraftReady(true);
  }, [customerMode, location.search]);

  const skipDraftSaveOnce = useRef(false);

  useEffect(() => {
    if (!customerMode || !draftReady) return;
    if (skipDraftSaveOnce.current) {
      skipDraftSaveOnce.current = false;
      return;
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        route, routeKeywords, answers, askedIds, structuredCount, current, phase, input,
        machineDetails, carDetails, selectedCategory, taxonomy, categoryDetails, decision, diagnosticLog, history,
      }));
    } catch {}
  }, [customerMode, draftReady, route, routeKeywords, answers, askedIds, structuredCount, current, phase, input,
      machineDetails, carDetails, selectedCategory, taxonomy, categoryDetails, decision, diagnosticLog, history]);

  const keywordGroups = useMemo(() => buildKeywordGroups(answers, routeKeywords), [answers, routeKeywords]);
  const searchTerms = useMemo(() => buildSearchTerms(answers, routeKeywords), [answers, routeKeywords]);
  const pushHistory = () => setHistory(previous => [...previous, {
    route, routeKeywords, answers, askedIds, structuredCount, current, phase, input,
    machineDetails, carDetails, selectedCategory, taxonomy, categoryDetails, decision, diagnosticLog,
  }]);
  const restore = previous => {
    setRoute(previous.route); setRouteKeywords(previous.routeKeywords); setAnswers(previous.answers);
    setAskedIds(previous.askedIds); setStructuredCount(previous.structuredCount); setCurrent(previous.current);
    setPhase(previous.phase); setInput(previous.input); setMachineDetails(previous.machineDetails);
    setCarDetails(previous.carDetails); setSelectedCategory(previous.selectedCategory || ''); setTaxonomy(previous.taxonomy || null);
    setCategoryDetails(previous.categoryDetails || {}); setDecision(previous.decision); setDiagnosticLog(previous.diagnosticLog);
    setCopyStatus('');
  };
  const goBack = () => {
    if (!history.length) return;
    restore(history[history.length - 1]);
    setHistory(previous => previous.slice(0, -1));
  };
  const chooseRoute = choice => {
    pushHistory();
    if (choice === 'machine') {
      const nextTaxonomy = {family:'Machines',path:['Machines']};
      setRoute(choice); setRouteKeywords([]); setTaxonomy(nextTaxonomy); setPhase('vehicle-type');
      setDiagnosticLog(previous => [...previous, {event:'route-selected',choice,addedKeywords:[],taxonomy:nextTaxonomy,nextStep:'vehicle-type'}]);
    } else if (choice === 'spares') {
      const nextTaxonomy = {family:'Parts of machines',path:['Parts of machines']};
      setRoute(choice); setRouteKeywords([]); setTaxonomy(nextTaxonomy); setPhase('vehicle-type');
      setDiagnosticLog(previous => [...previous, {event:'route-selected',choice,addedKeywords:[],taxonomy:nextTaxonomy,nextStep:'vehicle-type'}]);
    } else {
      setRoute(choice); setRouteKeywords([]); setSelectedCategory(''); setTaxonomy(null); setCategoryDetails({}); setPhase('category');
      setCurrent({id:'description',label:'What is it?',placeholder:'Enter the item name or a short description'});
      setDiagnosticLog(previous => [...previous, {event:'route-selected',choice,addedKeywords:[],nextStep:'category'}]);
    }
  };
  const chooseGeneralCategory = category => {
    pushHistory();
    const isOtherNotSure = category === 'Other / not sure';
    const taxonomyCategory = isOtherNotSure ? 'And now for something completely different.' : category;
    setSelectedCategory(taxonomyCategory);
    const nextTaxonomy = {family:taxonomyCategory,path:[taxonomyCategory]};
    setTaxonomy(nextTaxonomy);
    setRouteKeywords([]);
    setInput('');
    setCurrent({id:'description',label:'What is it?',placeholder:'Enter the item name or a short description'});
    if (isOtherNotSure) {
      setCategoryDetails({});
      setPhase('general-questionnaire');
      setDiagnosticLog(previous => [...previous,{event:'general-category-selected',category:taxonomyCategory,buttonLabel:category,taxonomy:nextTaxonomy,addedKeywords:[],nextStep:'general-questionnaire',adaptiveQuestionnaireStarted:false}]);
    } else {
      setCategoryDetails({});
      setPhase('category-form');
      setDiagnosticLog(previous => [...previous,{event:'general-category-selected',category,taxonomy:nextTaxonomy,addedKeywords:[],nextStep:'category-form',adaptiveQuestionnaireStarted:false,formFields:(CATEGORY_FORM_FIELDS[category] || ['type','make','model','condition']).map(key=>key === 'condition' && MACHINE_STATUS_CATEGORIES.has(category) ? 'workingStatus' : key)}]);
    }
  };
  const completeCategoryForm = event => {
    event?.preventDefault();
    pushHistory();
    const details = Object.fromEntries(Object.entries(categoryDetails).map(([key,value]) => [key,clean(value)]).filter(([,value]) => value !== ''));
    const nextAnswers = {...answers};
    categoryFormFields.forEach(key => delete nextAnswers[key]);
    Object.assign(nextAnswers, details);
    setAnswers(nextAnswers);
    setInput(''); setPhase('complete');
    const groups = buildKeywordGroups(nextAnswers,routeKeywords), terms = buildSearchTerms(nextAnswers,routeKeywords);
    const result = {done:true,reason:'Category-specific details recorded; no extra free-text fields.',keywordGroups:groups,searchTerms:terms};
    setDecision(result);
    setDiagnosticLog(previous => [...previous,{event:'category-details-recorded',category:selectedCategory,answers:nextAnswers,formFields:Object.keys(details),nextQuestionId:null,finalOptionalQuestionProvided:false,keywordGroups:groups,searchTerms:terms}]);
  };
  const chooseMachineType = choice => {
    pushHistory();
    const root = route === 'spares' ? 'Parts of machines' : 'Machines';
    const branch = route === 'spares'
      ? (choice === 'car' ? 'Parts of vehicles' : 'Parts of other machines')
      : (choice === 'car' ? 'Vehicles' : 'Other machines');
    const leaf = route === 'spares' ? (choice === 'car' ? 'Car parts' : '') : '';
    const path = [root, branch, ...(leaf ? [leaf] : [])];
    const nextTaxonomy = {family:root,path};
    setTaxonomy(nextTaxonomy);
    setRouteKeywords([]);
    setRoute(choice === 'car' ? (route === 'spares' ? 'spares-car' : 'car') : (route === 'spares' ? 'spares-machine' : 'machine'));
    const nextPhase = choice === 'car' && route !== 'spares' ? 'vehicle-classification' : (choice === 'car' ? 'car-form' : 'machine-form');
    setPhase(nextPhase);
    setDiagnosticLog(previous => [...previous, {event:'machine-kind-selected',choice,taxonomy:nextTaxonomy,addedKeywords:[],nextStep:nextPhase}]);
  };
  const updateForm = (setter,key,value) => setter(previous => ({...previous,[key]:value}));
  const removeAnswer = key => setAnswers(previous => { const next = {...previous}; delete next[key]; return next; });
  const clearCategoryDetail = key => {
    updateForm(setCategoryDetails, key, '');
    const mapped = {whatIsIt:'description',sellerDescription:'machineDescription',whatIsItCalled:'title',whatIsItUsedFor:'use',whoMadeIt:'make',whereMade:'origin',whenMade:'year',whatMadeOf:'material',dimensions:'dimensions',condition:'condition',unusual:'fault',identifyingMarks:'identifyingMarks',buyerNotes:'freeform'};
    removeAnswer(mapped[key] || key);
  };
  const clearInputAnswer = key => { setInput(''); if (key) removeAnswer(key); };
  const completeForm = event => {
    event?.preventDefault(); pushHistory();
    const isCar = phase === 'car-form';
    const details = Object.fromEntries(Object.entries(isCar ? carDetails : machineDetails).map(([key,value]) => [key,clean(value)]));
    const nextAnswers = {
      ...answers,
      ...(isCar ? {
        make:details.make, model:details.model, year:details.year, variant:details.variant,
        partNumber:details.partNumber, mileage:details.mileage, fuelType:details.fuelType,
        transmission:details.transmission, colour:details.colour, runningOperating:details.runningOperating,
        identification:details.otherDetails,
      } : {
        machineClass:details.machineClass, make:details.make, model:details.model, year:details.year, partNumber:details.partNumber,
        identification:details.otherDetails, colour:details.colour, runningOperating:details.runningOperating,

      }),
    };
    setAnswers(nextAnswers);
    // Taxonomy is determined by explicit button choices, not seller-entered keywords.
    const nextTaxonomy = taxonomy;
    setTaxonomy(nextTaxonomy);
    setPhase('complete'); setInput('');
    const groups = buildKeywordGroups(nextAnswers,routeKeywords), terms = buildSearchTerms(nextAnswers,routeKeywords);
    const reason = (isCar ? 'Vehicle' : 'Machine') + ' details recorded; no extra free-text fields.';
    setDecision({done:true,reason,keywordGroups:groups,searchTerms:terms});
    setDiagnosticLog(previous => [...previous,{event:isCar?'car-details-recorded':'machine-details-recorded',answers:nextAnswers,taxonomy:nextTaxonomy,nextQuestionId:null,finalOptionalQuestionProvided:false,keywordGroups:groups,searchTerms:terms}]);
  };
  const completeGeneralQuestionnaire = event => {
    event?.preventDefault();
    pushHistory();
    const nextAnswers = {};
    const map = [
      ['whatIsIt','description'],['sellerDescription','machineDescription'],['whatIsItCalled','title'],['whatIsItUsedFor','use'],
      ['whoMadeIt','make'],['whereMade','origin'],['whenMade','year'],['whatMadeOf','material'],
      ['dimensions','dimensions'],['condition','condition'],['unusual','fault'],
      ['identifyingMarks','identifyingMarks'],['buyerNotes','freeform'],
    ];
    for (const [source, target] of map) {
      const value = categoryDetails[source] ?? '';
      if (String(value).trim()) nextAnswers[target] = target === 'description' ? String(value) : clean(value);
    }
    setAnswers(nextAnswers);
    setInput('');
    setPhase('complete');
    const groups = buildKeywordGroups(nextAnswers, []);
    const terms = buildSearchTerms(nextAnswers, []);
    setDecision({done:true,reason:'General questionnaire completed.',keywordGroups:groups,searchTerms:terms});
    setDiagnosticLog(previous=>[...previous,{
      event:'general-questionnaire-completed',
      category:'And now for something completely different.',
      originalKeyword:categoryDetails.whatIsIt ?? '',
      answers:nextAnswers,keywordGroups:groups,searchTerms:terms
    }]);
  };
  const submitAnswer = event => {
    event?.preventDefault();
    if (phase === 'general-questionnaire') return completeGeneralQuestionnaire(event);
    if (phase === 'vehicle-classification') {
      pushHistory();
      const vehicleType = clean(input);
      const root = 'Machines';
      const path = vehicleType ? [root, 'Vehicles', vehicleType] : [root, 'Vehicles'];
      const nextTaxonomy = {family:root,path};
      const nextAnswers = vehicleType ? {...answers,vehicleType} : {...answers};
      setAnswers(nextAnswers); setTaxonomy(nextTaxonomy); setInput(''); setPhase('car-form');
      setDiagnosticLog(previous => [...previous,{event:'vehicle-type-recorded',question:'What sort of vehicle is it?',answer:vehicleType,answerStatus:vehicleType?'supplied':'blank-unsupplied',taxonomy:nextTaxonomy,keywordGroups:buildKeywordGroups(nextAnswers,routeKeywords),searchTerms:buildSearchTerms(nextAnswers,routeKeywords),nextStep:'vehicle-form'}]);
      return;
    }
    if (phase === 'machine-form' || phase === 'car-form') return completeForm(event);
    if (phase === 'category-form') return completeCategoryForm(event);
    pushHistory();
    const value = clean(input);
    const nextAnswers=value?{...answers,[current.id]:value}:{...answers};
    const nextAsked=[...new Set([...askedIds,current.id])];
    const nextCount=structuredCount+1;
    const result=getNextGeneralQuestion(nextAnswers,nextAsked,nextCount);
    setAnswers(nextAnswers); setAskedIds(nextAsked); setStructuredCount(nextCount); setInput(''); setDecision(result);
    const groups=buildKeywordGroups(nextAnswers,routeKeywords),terms=buildSearchTerms(nextAnswers,routeKeywords);
    setDiagnosticLog(previous=>[...previous,
      {event:'answer-recorded',questionId:current.id,question:current.label,answer:value,answerStatus:value?'supplied':'blank-unsupplied',structuredCount:nextCount,keywordGroups:groups,searchTerms:terms},
      {event:result.done?'structured-questions-stopped':'next-question-selected',nextQuestionId:result.done?null:result.question.id,reason:result.reason,keywordGroups:groups,searchTerms:terms},
    ]);
    if(result.done) setPhase('complete');
    else setCurrent(result.question);
  };
  const reset = () => {
    if (customerMode) { try { localStorage.removeItem(DRAFT_KEY); } catch {} }
    setRoute('');setRouteKeywords([]);setAnswers({});setAskedIds([]);setStructuredCount(0);
    setCurrent({id:'description',label:'What is it?',placeholder:'Enter the item name or a short description'});
    setPhase('route');setInput('');setMachineDetails(EMPTY_MACHINE);setCarDetails(EMPTY_CAR);
    setSelectedCategory('');setTaxonomy(null);setCategoryDetails({});
    setDecision(null);setDiagnosticLog([]);setHistory([]);setCopyStatus('');setDraftReady(true);
  };
  const abandon = () => { if (customerMode) reset(); else if (window.confirm('Abandon this test and discard the answers?')) reset(); };
  const diagnostics = JSON.stringify({
    test:'sifter-mk4-taxonomy-and-keywords',purpose:'Button choices build explicit taxonomy; seller answers generate search keywords separately. No Registry writes.',
    maxStructuredQuestions:MAX_QUESTIONS,target:'Fewest useful questions; 12 structured questions is the hard ceiling, not the goal.',
    phase,route,selectedCategory,taxonomy,routeKeywords,structuredCount,currentQuestion:current,destination:'Test page only — no Registry write is performed',
    answers,askedIds,keywordGroups,searchTerms,outputCounts:{keywordGroups:keywordGroups.length,searchTerms:searchTerms.length},
    generatedOutput:{keywordGroups,searchTerms},lastDecision:decision,log:diagnosticLog,
    navigation:{canGoBack:history.length>0,historyDepth:history.length},
  },null,2);
  const copyDiagnostics = async () => {
    setCopyStatus('');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(diagnostics);
        setCopyStatus('Diagnostics copied.');
        return;
      }
    } catch {}
    let area;
    try {
      area = document.createElement('textarea');
      area.value = diagnostics;
      area.setAttribute('readonly', '');
      area.setAttribute('aria-label', 'Diagnostics to copy');
      area.style.position = 'fixed';
      area.style.left = '0';
      area.style.top = '0';
      area.style.width = '1px';
      area.style.height = '1px';
      area.style.opacity = '0.01';
      document.body.appendChild(area);
      area.focus();
      area.select();
      area.setSelectionRange(0, area.value.length);
      const copied = document.execCommand('copy');
      area.remove();
      setCopyStatus(copied ? 'Diagnostics copied.' : 'Automatic copy was blocked. Select the diagnostic text below and press Ctrl+C.');
    } catch {
      area?.remove();
      setCopyStatus('Automatic copy was blocked. Select the diagnostic text below and press Ctrl+C.');
    }
  };
  const complete = phase === 'complete';
  const machineForm = phase === 'machine-form';
  const carForm = phase === 'car-form';
  const vehicleClassification = phase === 'vehicle-classification';
  const categoryForm = phase === 'category-form';
  const generalQuestionnaire = phase === 'general-questionnaire';
  const categoryFormFields = (CATEGORY_FORM_FIELDS[selectedCategory] || ['type','make','model','condition']).map(key=>key === 'condition' && MACHINE_STATUS_CATEGORIES.has(selectedCategory) ? 'workingStatus' : key);
  const field = (key,label,placeholder='Enter '+label.toLowerCase()+' if known',setter=machineForm?setMachineDetails:setCarDetails,source=machineForm?machineDetails:carDetails) => (
    <label key={key} className="block text-sm font-semibold">{label}
      <div className="mt-2 flex items-start gap-2"><input value={source[key] ?? ''} onChange={e=>updateForm(setter,key,e.target.value)} placeholder={placeholder} className="w-full rounded-xl border bg-background px-4 py-3 text-base font-normal outline-none focus:ring-2 focus:ring-ring" /><button type="button" tabIndex={-1} aria-label={'Clear '+label} title="Clear answer" onClick={()=>updateForm(setter,key,'')} className="rounded-full border px-2.5 py-2 text-sm font-bold">×</button></div>
    </label>
  );
  const operatingField = (setter,source) => <fieldset><div className="flex items-center justify-between gap-3"><legend className="text-sm font-semibold">Running / operating?</legend>{source.runningOperating && <button type="button" tabIndex={-1} aria-label="Clear running / operating answer" onClick={()=>updateForm(setter,'runningOperating','')} className="rounded-full border px-2.5 py-1 text-sm font-bold">×</button>}</div><div className="mt-2 flex gap-3">{['Yes','No'].map(choice=><button key={choice} type="button" aria-pressed={source.runningOperating===choice} onClick={()=>updateForm(setter,'runningOperating',choice)} className={'rounded-full border px-6 py-3 font-semibold '+(source.runningOperating===choice?'border-red-600 bg-red-600 text-white':'bg-background hover:border-red-600')}>{choice}</button>)}</div></fieldset>;
  return <div className="min-h-screen bg-background"><div className={`mx-auto flex min-h-screen w-full ${phase==='category'?'w-[80vw] max-w-none':'max-w-5xl'} flex-col px-5 py-8 sm:px-8`}>
    {!customerMode && <header className="mb-10"><p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">S.O.B.S TEST</p><h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Sifter MK4 — Taxonomy and keywords</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground">Button choices build the item's taxonomy. Seller details generate searchable keywords separately. Test only; no Registry write is performed.</p></header>}
    <div className={`grid flex-1 gap-8 ${customerMode || phase==='category'?'grid-cols-1':'md:grid-cols-[1fr_300px]'}`}>
      <main className={`rounded-2xl border bg-background p-6 shadow-sm sm:p-10 ${phase==='category'?'w-full':''}`}>
        {!complete ? <>
          <div className="flex items-center justify-between gap-4"><span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">{phase==='route'?'CHOOSE A ROUTE':phase==='vehicle-type'?'MACHINE ROUTE':phase==='category'?'CHOOSE A CATEGORY':categoryForm?'CATEGORY DETAILS':machineForm?'MACHINE DETAILS':carForm?'CAR DETAILS':'STRUCTURED QUESTION '+(structuredCount+1)+' OF '+MAX_QUESTIONS}</span>{customerMode ? (phase==='route' ? <button type="button" onClick={()=>navigate('/')} className="rounded-full border px-4 py-2 text-sm font-semibold">Exit</button> : null) : <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide">Test only</span>}</div>
          {phase==='route' ? <div className="mt-10"><h2 className="text-2xl font-semibold sm:text-3xl">What are you listing?</h2><div className="mt-6 grid gap-3 sm:grid-cols-3">{[['machine','Machine'],['spares','Part of a machine'],['other','Everything else']].map(([value,label])=><button key={value} type="button" onClick={()=>chooseRoute(value)} className="min-h-16 rounded-xl border border-red-600 bg-red-600 px-4 py-4 text-lg font-semibold text-white transition hover:bg-red-700">{label}</button>)}</div></div>
          : phase==='vehicle-type' ? <div className="mt-10"><h2 className="text-2xl font-semibold sm:text-3xl">Is it parts of a vehicle or other machine?</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{[['car','Vehicles','Adds “Vehicles” and asks the seller to name the vehicle type'],['machine','Other machine','Opens the existing machine-details form']].map(([value,label,desc])=><button key={value} type="button" onClick={()=>chooseMachineType(value)} className="min-h-16 rounded-xl border border-blue-600 bg-blue-600 px-4 py-4 text-lg font-semibold text-white transition hover:bg-blue-700">{label}</button>)}</div></div>
          : vehicleClassification ? <form onSubmit={submitAnswer} onKeyDown={e => { if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || e.target.type === 'submit') return; e.preventDefault(); if (phase === 'machine-form' || phase === 'car-form' || phase === 'category-form') { const fields = Array.from(e.currentTarget.querySelectorAll('input:not([type="radio"]):not([type="submit"]), select')).filter(el => !el.disabled && el.tabIndex !== -1); const index = fields.indexOf(e.target); if (index >= 0 && index < fields.length - 1) fields[index + 1].focus(); return; } e.currentTarget.requestSubmit(); }} className="mt-10"><p className="text-base font-bold">{FORM_INSTRUCTION}</p><h2 className="text-2xl font-semibold leading-tight sm:text-3xl">What sort of vehicle is it?</h2><p className="mt-3 text-sm text-muted-foreground">Use your own description, such as truck, SUV, kit car or motorcycle.</p><div className="mt-6 flex items-start gap-2"><input autoFocus value={input} onChange={e=>setInput(e.target.value)} placeholder="Vehicle type" className="w-full rounded-xl border bg-background px-5 py-5 text-xl outline-none focus:ring-2 focus:ring-ring sm:text-2xl"/><button type="button" tabIndex={-1} aria-label="Clear vehicle type" onClick={()=>clearInputAnswer('vehicleType')} className="rounded-full border px-2.5 py-2 text-sm font-bold">×</button></div><div className="mt-5 flex justify-end"><button type="submit" className="rounded-full bg-red-600 px-7 py-3 font-semibold text-white">Continue</button></div></form>
          : phase==='category' ? <div className="mt-10"><h2 className="text-2xl font-semibold sm:text-3xl">Which category best fits the item?</h2><p className="mt-3 text-sm text-muted-foreground">Choose the item's top-level family. The sifter then collects useful searchable details.</p><div className="mt-6 grid grid-cols-4 gap-3">{GENERAL_CATEGORIES.map((category,index)=><button key={category} type="button" onClick={()=>chooseGeneralCategory(category)} style={{backgroundColor:GENERAL_CATEGORY_BUTTON_COLORS[index % GENERAL_CATEGORY_BUTTON_COLORS.length]}} className="flex h-16 min-w-0 w-full items-center justify-center overflow-hidden rounded-full px-1 text-center text-sm font-semibold leading-tight text-white transition hover:brightness-95">{category}</button>)}</div></div>
           : generalQuestionnaire ? <form onSubmit={submitAnswer} onKeyDown={e => { if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || e.target.type === 'submit') return; e.preventDefault(); if (phase === 'machine-form' || phase === 'car-form' || phase === 'category-form') { const fields = Array.from(e.currentTarget.querySelectorAll('input:not([type="radio"]):not([type="submit"]), select')).filter(el => !el.disabled && el.tabIndex !== -1); const index = fields.indexOf(e.target); if (index >= 0 && index < fields.length - 1) fields[index + 1].focus(); return; } e.currentTarget.requestSubmit(); }} className="mt-8 space-y-5 rounded-2xl border bg-muted/20 p-5">
             <p className="text-base font-bold">{FORM_INSTRUCTION}</p>
             {[
               ['whatIsIt','What is it?','Enter the item name exactly as you would describe it'],
               ['sellerDescription','Seller description','Describe this unusual or hard-to-classify item'],
               ['whatIsItCalled','What is it called?','Any other name, if known'],
               ['whatIsItUsedFor','What is it used for?','Optional'],
               ['whoMadeIt','Who made it?','Maker or manufacturer, if known'],
               ['whereMade','Where was it made?','Place of manufacture, if known'],
               ['whenMade','When was it made?','Date or period, if known'],
               ['whatMadeOf','What is it made of?','Materials, if known'],
               ['dimensions','What are its dimensions or size?','Measurements and units, if known'],
               ['condition','What condition is it in?','Optional'],
               ['unusual','Is anything missing, damaged or unusual about it?','Optional'],
               ['identifyingMarks','Does it have any identifying marks, numbers or labels?','Optional'],
               ['buyerNotes','Anything else you\'d like to add?','Optional extra details']
             ].map(([key,label,placeholder])=><label key={key} className="block text-sm font-semibold">{label}<div className="mt-2 flex items-start gap-2">{['sellerDescription','buyerNotes'].includes(key)?<textarea value={categoryDetails[key]||''} onChange={e=>updateForm(setCategoryDetails,key,e.target.value)} rows={4} placeholder={placeholder} className="w-full rounded-xl border bg-background px-4 py-3 text-base font-normal"/>:<textarea value={categoryDetails[key]||''} onChange={e=>updateForm(setCategoryDetails,key,e.target.value)} rows={2} placeholder={placeholder} className="w-full rounded-xl border bg-background px-4 py-3 text-base font-normal"/>}<button type="button" tabIndex={-1} aria-label={'Clear '+label} onClick={()=>clearCategoryDetail(key)} className="rounded-full border px-2.5 py-2 text-sm font-bold">×</button></div></label>)}
             <div className="flex justify-end"><button type="submit" className="rounded-full bg-red-600 px-7 py-3 font-semibold text-white">Finish questionnaire</button></div>
           </form>
          : categoryForm ? <form onSubmit={submitAnswer} onKeyDown={e => { if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || e.target.type === 'submit') return; e.preventDefault(); if (phase === 'machine-form' || phase === 'car-form' || phase === 'category-form') { const fields = Array.from(e.currentTarget.querySelectorAll('input:not([type="radio"]):not([type="submit"]), select')).filter(el => !el.disabled && el.tabIndex !== -1); const index = fields.indexOf(e.target); if (index >= 0 && index < fields.length - 1) fields[index + 1].focus(); return; } e.currentTarget.requestSubmit(); }} className="mt-8 space-y-5 rounded-2xl border bg-muted/20 p-5"><p className="text-base font-bold">{FORM_INSTRUCTION}</p><h2 className="text-xl font-semibold">{selectedCategory}</h2>{categoryFormFields.map(key=>{if(key==='workingStatus')return <fieldset key="workingStatus" className="block"><div className="flex items-center justify-between gap-3"><legend className="text-sm font-semibold">Working?</legend>{categoryDetails.workingStatus && <button type="button" tabIndex={-1} aria-label="Clear working status" onClick={()=>clearCategoryDetail('workingStatus')} className="rounded-full border px-2.5 py-1 text-sm font-bold">×</button>}</div><div className="mt-2 flex items-center gap-6"><label className="inline-flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="category-working-status" value="Working" checked={categoryDetails.workingStatus==='Working'} onChange={()=>updateForm(setCategoryDetails,'workingStatus','Working')} className="h-4 w-4 accent-red-600"/>Yes</label><label className="inline-flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="category-working-status" value="Not working" checked={categoryDetails.workingStatus==='Not working'} onChange={()=>updateForm(setCategoryDetails,'workingStatus','Not working')} className="h-4 w-4 accent-red-600"/>No</label></div></fieldset>;const def=CATEGORY_FIELD_DEFS[key];if(!def)return null;return <label key={key} className="block text-sm font-semibold">{def.label}<div className="mt-2 flex items-start gap-2"><input value={categoryDetails[key]||''} onChange={e=>updateForm(setCategoryDetails,key,e.target.value)} placeholder={def.placeholder} className="w-full rounded-xl border bg-background px-4 py-3 text-base font-normal outline-none focus:ring-2 focus:ring-ring"/><button type="button" tabIndex={-1} aria-label={'Clear '+def.label} onClick={()=>clearCategoryDetail(key)} className="rounded-full border px-2.5 py-2 text-sm font-bold">×</button></div></label>})}<div className="flex justify-end"><button type="submit" className="rounded-full bg-red-600 px-7 py-3 font-semibold text-white">Continue</button></div></form>
          : machineForm || carForm ? <form onSubmit={submitAnswer} onKeyDown={e => { if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || e.target.type === 'submit') return; e.preventDefault(); if (phase === 'machine-form' || phase === 'car-form' || phase === 'category-form') { const fields = Array.from(e.currentTarget.querySelectorAll('input:not([type="radio"]):not([type="submit"]), select')).filter(el => !el.disabled && el.tabIndex !== -1); const index = fields.indexOf(e.target); if (index >= 0 && index < fields.length - 1) fields[index + 1].focus(); return; } e.currentTarget.requestSubmit(); }} className="mt-8 space-y-5 rounded-2xl border bg-muted/20 p-5">
            <p className="text-base font-bold">{FORM_INSTRUCTION}</p>
            <h2 className="text-xl font-semibold">{carForm?'Vehicle details':'Machine details'}</h2>
            {carForm ? <>{field('make','Make')}{field('model','Model')}{field('year','Year')}{field('variant','Variant / trim')}{field('partNumber','Part number')}{field('mileage','Mileage')}{field('fuelType','Fuel type')}{field('transmission','Transmission')}{field('colour','Colour')}{field('otherDetails','Other identifying details', 'Registration / engine / useful identifiers',setCarDetails,carDetails)}{operatingField(setCarDetails,carDetails)}</>
              : <>{field('machineClass','Class of machine','Farm, industrial, audio? etc',setMachineDetails,machineDetails)}{field('make','Make')}{field('model','Model')}{field('year','Year')}{field('partNumber','Part number')}{field('otherDetails','Other identifying details','Enter any other identifiers',setMachineDetails,machineDetails)}{field('colour','Colour')}{operatingField(setMachineDetails,machineDetails)}</>}
            <div className="flex justify-end"><button type="submit" className="rounded-full bg-red-600 px-7 py-3 font-semibold text-white">Continue</button></div>
          </form>
          : <form onSubmit={submitAnswer} onKeyDown={e => { if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || e.target.type === 'submit') return; e.preventDefault(); if (phase === 'machine-form' || phase === 'car-form' || phase === 'category-form') { const fields = Array.from(e.currentTarget.querySelectorAll('input:not([type="radio"]):not([type="submit"]), select')).filter(el => !el.disabled && el.tabIndex !== -1); const index = fields.indexOf(e.target); if (index >= 0 && index < fields.length - 1) fields[index + 1].focus(); return; } e.currentTarget.requestSubmit(); }} className="mt-10"><p className="text-base font-bold">{FORM_INSTRUCTION}</p><h2 className="text-2xl font-semibold leading-tight sm:text-3xl">{current.label}</h2><div className="mt-6 flex items-start gap-2"><input autoFocus value={input} onChange={e=>setInput(e.target.value)} placeholder={current.placeholder} className="w-full rounded-xl border bg-background px-5 py-5 text-xl outline-none focus:ring-2 focus:ring-ring sm:text-2xl"/><button type="button" tabIndex={-1} aria-label={'Clear '+current.label} onClick={()=>clearInputAnswer(current.id)} className="rounded-full border px-2.5 py-2 text-sm font-bold">×</button></div><div className="mt-5 flex justify-end"><button type="submit" className="rounded-full bg-red-600 px-7 py-3 font-semibold text-white">Submit answer</button></div>{decision?.reason&&<p className="mt-5 text-sm text-muted-foreground">{decision.reason}</p>}</form>}
          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t pt-5"><button type="button" onClick={goBack} disabled={!history.length} className="rounded-full border px-5 py-2 text-sm font-semibold disabled:opacity-40">Back</button><button type="button" onClick={abandon} className="rounded-full border px-5 py-2 text-sm font-semibold">{customerMode ? 'Abandon' : 'Abandon test'}</button></div>
        </> : customerMode ? <div className="flex min-h-[400px] flex-col justify-center"><h2 className="mt-4 text-3xl font-semibold tracking-tight">Your item details are ready.</h2><p className="mt-3 text-muted-foreground">Continue to create your listing.</p><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={goBack} disabled={!history.length} className="rounded-full border px-6 py-3 font-semibold disabled:opacity-40">Back</button><button type="button" onClick={abandon} className="rounded-full border px-6 py-3 font-semibold">Abandon</button><button type="button" onClick={()=>onContinue?.({answers,taxonomy,keywordGroups,searchTerms})} className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Continue to Create</button></div></div> : <div className="flex min-h-[400px] flex-col justify-center"><p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">CLASSIFICATION READY</p><h2 className="mt-4 text-4xl font-semibold tracking-tight">Taxonomy and search terms collected.</h2><div className="mt-8 rounded-xl border bg-muted/20 p-5"><p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">TOP-LEVEL TAXONOMY</p><p className="mt-3 font-semibold">{taxonomy?.family || 'Not assigned'}</p><p className="mt-1 text-sm text-muted-foreground">{taxonomy?.path?.join(' → ') || 'No taxonomy selected'}</p><p className="mt-6 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">GENERATED SEARCH TERMS</p><div className="mt-3 flex flex-wrap gap-2">{searchTerms.length?searchTerms.map(term=><span key={term} className="rounded-full border bg-background px-3 py-1 text-sm">{term}</span>):<span className="text-sm text-muted-foreground">No search terms supplied.</span>}</div></div><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={goBack} disabled={!history.length} className="rounded-full border px-6 py-3 font-semibold disabled:opacity-40">Back</button><button type="button" onClick={abandon} className="rounded-full border px-6 py-3 font-semibold">{customerMode ? 'Abandon' : 'Abandon test'}</button><button type="button" onClick={reset} className="rounded-full border px-6 py-3 font-semibold">Run another test</button></div></div>}
      </main>
      {!customerMode && <aside className="rounded-2xl border bg-muted/20 p-5"><p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">TAXONOMY</p><p className="mt-3 font-semibold">{taxonomy?.family || 'Not assigned yet'}</p><p className="mt-1 break-words text-sm text-muted-foreground">{taxonomy?.path?.join(' → ') || 'Choose a button to classify the item'}</p><div className="mt-5 border-t pt-4"><p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">KEYWORDS RECORDED</p><div className="mt-4 space-y-4">{keywordGroups.length?keywordGroups.map(group=><div key={group.id}><p className="text-xs uppercase tracking-wide text-muted-foreground">{group.label}</p><p className="mt-1 break-words font-medium">{group.value}</p></div>):<p className="text-sm text-muted-foreground">No keywords yet.</p>}</div><div className="mt-6 border-t pt-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Search terms</p><div className="mt-3 flex flex-wrap gap-2">{searchTerms.map(term=><span key={term} className="rounded-full border bg-background px-2 py-1 text-xs">{term}</span>)}</div></div><div className="mt-6 border-t pt-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Answers recorded</p><div className="mt-3 space-y-3">{Object.entries(answers).map(([key,value])=><div key={key}><p className="text-xs text-muted-foreground">{LABELS[key]||key}</p><p className="mt-1 break-words text-sm">{clean(value)||'Unknown / skipped'}</p></div>)}</div></div></div></aside>}
      <section hidden={customerMode} className="rounded-2xl border bg-muted/20 p-5 md:col-span-2"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">DIAGNOSTICS</p><p className="mt-2 text-sm text-muted-foreground">Includes taxonomy, answers, generated keywords, decisions and the event log. Taxonomy and search terms are separate; no Registry write is performed.</p>{copyStatus&&<p className="mt-2 text-sm" role="status">{copyStatus}</p>}</div><button type="button" onClick={copyDiagnostics} className="rounded-full border bg-background px-5 py-2 text-sm font-semibold">Copy diagnostics</button></div><pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-background p-4 text-xs leading-relaxed">{diagnostics}</pre></section>
    </div>
  </div></div>;
}
