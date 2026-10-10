import React, { useMemo, useState } from 'react';
import { buildKeywordGroups, buildSearchTerms, getMaxStructuredQuestions, getNextGeneralQuestion } from '../lib/sifterMK3Engine';

const MAX_QUESTIONS = getMaxStructuredQuestions();
const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
const EMPTY_MACHINE = { make:'', model:'', year:'', partNumber:'', otherDetails:'', colour:'', runningOperating:'', machineDescription:'' };
const EMPTY_CAR = { make:'', model:'', year:'', variant:'', partNumber:'', mileage:'', fuelType:'', transmission:'', colour:'', runningOperating:'', otherDetails:'', machineDescription:'' };
const LABELS = { description:'What it is', type:'Narrower type', feature:'Feature / distinguishing detail', freeform:'Anything else to add' };

export default function SifterMK3() {
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
  const [decision, setDecision] = useState(null);
  const [diagnosticLog, setDiagnosticLog] = useState([]);
  const [history, setHistory] = useState([]);
  const [copyStatus, setCopyStatus] = useState('');

  const keywordGroups = useMemo(() => buildKeywordGroups(answers, routeKeywords), [answers, routeKeywords]);
  const searchTerms = useMemo(() => buildSearchTerms(answers, routeKeywords), [answers, routeKeywords]);
  const pushHistory = () => setHistory(previous => [...previous, {
    route, routeKeywords, answers, askedIds, structuredCount, current, phase, input,
    machineDetails, carDetails, decision, diagnosticLog,
  }]);
  const restore = previous => {
    setRoute(previous.route); setRouteKeywords(previous.routeKeywords); setAnswers(previous.answers);
    setAskedIds(previous.askedIds); setStructuredCount(previous.structuredCount); setCurrent(previous.current);
    setPhase(previous.phase); setInput(previous.input); setMachineDetails(previous.machineDetails);
    setCarDetails(previous.carDetails); setDecision(previous.decision); setDiagnosticLog(previous.diagnosticLog);
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
      setRoute(choice); setRouteKeywords(['machine']); setPhase('vehicle-type');
      setDiagnosticLog(previous => [...previous, {event:'route-selected',choice,addedKeywords:['machine'],nextStep:'vehicle-type'}]);
    } else if (choice === 'spares') {
      setRoute(choice); setRouteKeywords(['spares']); setPhase('vehicle-type');
      setDiagnosticLog(previous => [...previous, {event:'route-selected',choice,addedKeywords:['spares'],nextStep:'vehicle-type'}]);
    } else {
      setRoute(choice); setRouteKeywords([]); setPhase('question');
      setCurrent({id:'description',label:'What is it?',placeholder:'Enter the item name or a short description'});
      setDiagnosticLog(previous => [...previous, {event:'route-selected',choice,addedKeywords:[],nextStep:'description'}]);
    }
  };
  const chooseMachineType = choice => {
    pushHistory();
    const added = choice === 'car' ? ['Cars'] : [];
    setRouteKeywords(previous => [...previous, ...added]);
    setRoute(choice === 'car' ? (route === 'spares' ? 'spares-car' : 'car') : (route === 'spares' ? 'spares-machine' : 'machine'));
    setPhase(choice === 'car' ? 'car-form' : 'machine-form');
    setDiagnosticLog(previous => [...previous, {event:'machine-kind-selected',choice,addedKeywords:added,nextStep:choice === 'car' ? 'car-form' : 'machine-form'}]);
  };
  const updateForm = (setter,key,value) => setter(previous => ({...previous,[key]:value}));
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
        identification:details.otherDetails, machineDescription:details.machineDescription,
      } : {
        make:details.make, model:details.model, year:details.year, partNumber:details.partNumber,
        identification:details.otherDetails, colour:details.colour, runningOperating:details.runningOperating,
        machineDescription:details.machineDescription,
      }),
    };
    setAnswers(nextAnswers); setCurrent({id:'freeform',label:'Anything else you\'d like to add?',placeholder:'Optional: add any other useful search terms'});
    setPhase('freeform'); setInput('');
    const groups = buildKeywordGroups(nextAnswers,routeKeywords), terms = buildSearchTerms(nextAnswers,routeKeywords);
    const reason = (isCar ? 'Car' : 'Machine') + ' details recorded. One final optional question follows.';
    setDecision({done:false,reason,keywordGroups:groups,searchTerms:terms});
    setDiagnosticLog(previous => [...previous,{event:isCar?'car-details-recorded':'machine-details-recorded',answers:nextAnswers,nextQuestionId:'freeform',finalOptionalQuestionProvided:true,keywordGroups:groups,searchTerms:terms}]);
  };
  const submitAnswer = event => {
    event?.preventDefault();
    if (phase === 'machine-form' || phase === 'car-form') return completeForm(event);
    pushHistory();
    const value = clean(input);
    if (phase === 'freeform') {
      const nextAnswers = {...answers,freeform:value}; setAnswers(nextAnswers); setInput(''); setPhase('complete');
      const groups=buildKeywordGroups(nextAnswers,routeKeywords), terms=buildSearchTerms(nextAnswers,routeKeywords);
      const result={done:true,reason:value?'Final optional addition recorded; no further questions will be asked.':'Final optional addition skipped; no further questions will be asked.',keywordGroups:groups,searchTerms:terms};
      setDecision(result);
      setDiagnosticLog(previous=>[...previous,{event:'final-addition-recorded',questionId:'freeform',answer:value||'Skipped',keywordGroups:groups,searchTerms:terms}]);
      return;
    }
    const nextAnswers={...answers,[current.id]:value};
    const nextAsked=[...new Set([...askedIds,current.id])];
    const nextCount=structuredCount+1;
    const result=getNextGeneralQuestion(nextAnswers,nextAsked,nextCount);
    setAnswers(nextAnswers); setAskedIds(nextAsked); setStructuredCount(nextCount); setInput(''); setDecision(result);
    const groups=buildKeywordGroups(nextAnswers,routeKeywords),terms=buildSearchTerms(nextAnswers,routeKeywords);
    setDiagnosticLog(previous=>[...previous,
      {event:'answer-recorded',questionId:current.id,question:current.label,answer:value||'Unknown / skipped',structuredCount:nextCount,keywordGroups:groups,searchTerms:terms},
      {event:result.done?'structured-questions-stopped':'next-question-selected',nextQuestionId:result.done?'freeform':result.question.id,reason:result.reason,keywordGroups:groups,searchTerms:terms},
    ]);
    if(result.done){setCurrent({id:'freeform',label:'Anything else you\'d like to add?',placeholder:'Optional: add any other useful search terms'});setPhase('freeform');}
    else setCurrent(result.question);
  };
  const reset = () => {
    setRoute('');setRouteKeywords([]);setAnswers({});setAskedIds([]);setStructuredCount(0);
    setCurrent({id:'description',label:'What is it?',placeholder:'Enter the item name or a short description'});
    setPhase('route');setInput('');setMachineDetails(EMPTY_MACHINE);setCarDetails(EMPTY_CAR);
    setDecision(null);setDiagnosticLog([]);setHistory([]);setCopyStatus('');
  };
  const abandon = () => { if (window.confirm('Abandon this test and discard the answers?')) reset(); };
  const diagnostics = JSON.stringify({
    test:'sifter-mk3-keyword-only',purpose:'Guide sellers to useful search keywords; no taxonomy classification or Registry writes.',
    maxStructuredQuestions:MAX_QUESTIONS,target:'Fewest useful questions; 12 structured questions is the hard ceiling, not the goal.',
    phase,route,routeKeywords,structuredCount,currentQuestion:current,destination:'Test page only — no Registry write is performed',
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
  const freeform = phase === 'freeform';
  const machineForm = phase === 'machine-form';
  const carForm = phase === 'car-form';
  const field = (key,label,placeholder='Enter '+label.toLowerCase()+' if known',setter=machineForm?setMachineDetails:setCarDetails,source=machineForm?machineDetails:carDetails) => (
    <label key={key} className="block text-sm font-semibold">{label}
      <input value={source[key] ?? ''} onChange={e=>updateForm(setter,key,e.target.value)} placeholder={placeholder}
        className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-base font-normal outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
  const operatingField = (setter,source) => <fieldset><legend className="text-sm font-semibold">Running / operating?</legend><div className="mt-2 flex gap-3">{['Yes','No'].map(choice=><button key={choice} type="button" aria-pressed={source.runningOperating===choice} onClick={()=>updateForm(setter,'runningOperating',choice)} className={'rounded-full border px-6 py-3 font-semibold '+(source.runningOperating===choice?'border-red-600 bg-red-600 text-white':'bg-background hover:border-red-600')}>{choice}</button>)}</div></fieldset>;
  return <div className="min-h-screen bg-background"><div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8">
    <header className="mb-10"><p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">S.O.B.S TEST</p><h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Sifter MK3 — Keyword generator</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground">Build useful search keywords. Route choices add keywords only where specified. No taxonomy is assigned and no Registry write is performed.</p></header>
    <div className="grid flex-1 gap-8 md:grid-cols-[1fr_300px]">
      <main className="rounded-2xl border bg-background p-6 shadow-sm sm:p-10">
        {!complete ? <>
          <div className="flex items-center justify-between gap-4"><span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">{phase==='route'?'CHOOSE A ROUTE':phase==='vehicle-type'?'MACHINE ROUTE':freeform?'OPTIONAL FINAL QUESTION':machineForm?'MACHINE DETAILS':carForm?'CAR DETAILS':'STRUCTURED QUESTION '+(structuredCount+1)+' OF '+MAX_QUESTIONS}</span><span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide">Test only</span></div>
          {phase==='route' ? <div className="mt-10"><h2 className="text-2xl font-semibold sm:text-3xl">What are you listing?</h2><div className="mt-6 grid gap-3">{[['machine','Machine','Adds “machine” to keywords'],['spares','Part of a machine','Adds “spares” to keywords'],['other','Everything else','Adds no route keyword']].map(([value,label,desc])=><button key={value} type="button" onClick={()=>chooseRoute(value)} className="rounded-xl border p-5 text-left hover:border-red-600"><span className="block text-lg font-semibold">{label}</span><span className="mt-1 block text-sm text-muted-foreground">{desc}</span></button>)}</div></div>
          : phase==='vehicle-type' ? <div className="mt-10"><h2 className="text-2xl font-semibold sm:text-3xl">Is it a car or another machine?</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{[['car','Car','Adds “Cars” and opens the car-specific form'],['machine','Other machine','Opens the existing machine-details form']].map(([value,label,desc])=><button key={value} type="button" onClick={()=>chooseMachineType(value)} className="rounded-xl border p-5 text-left hover:border-red-600"><span className="block text-lg font-semibold">{label}</span><span className="mt-1 block text-sm text-muted-foreground">{desc}</span></button>)}</div></div>
          : machineForm || carForm ? <form onSubmit={submitAnswer} className="mt-8 space-y-5 rounded-2xl border bg-muted/20 p-5">
            <h2 className="text-xl font-semibold">{carForm?'Car details':'Machine details'}</h2>
            {carForm ? <>{field('make','Make')}{field('model','Model')}{field('year','Year')}{field('variant','Variant / trim')}{field('partNumber','Part number')}{field('mileage','Mileage')}{field('fuelType','Fuel type')}{field('transmission','Transmission')}{field('colour','Colour')}{field('otherDetails','Other identifying details', 'Registration / engine / useful identifiers',setCarDetails,carDetails)}{operatingField(setCarDetails,carDetails)}<label className="block text-sm font-semibold">Seller description<textarea value={carDetails.machineDescription} onChange={e=>updateForm(setCarDetails,'machineDescription',e.target.value)} rows={4} placeholder="Describe the car in your own words" className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-base font-normal"/></label></>
              : <>{field('make','Make')}{field('model','Model')}{field('year','Year')}{field('partNumber','Part number')}{field('otherDetails','Other identifying details','Enter any other identifiers',setMachineDetails,machineDetails)}{field('colour','Colour')}{operatingField(setMachineDetails,machineDetails)}<label className="block text-sm font-semibold">Seller description<textarea value={machineDetails.machineDescription} onChange={e=>updateForm(setMachineDetails,'machineDescription',e.target.value)} rows={4} placeholder="Describe the machine or part in your own words" className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-base font-normal"/></label></>}
            <div className="flex justify-end"><button type="submit" className="rounded-full bg-red-600 px-7 py-3 font-semibold text-white">Continue</button></div>
          </form>
          : <form onSubmit={submitAnswer} className="mt-10"><h2 className="text-2xl font-semibold leading-tight sm:text-3xl">{current.label}</h2>{freeform&&<p className="mt-3 text-sm text-muted-foreground">Optional. Add further useful search terms or leave blank to finish.</p>}<input autoFocus value={input} onChange={e=>setInput(e.target.value)} placeholder={current.placeholder} className="mt-6 w-full rounded-xl border bg-background px-5 py-5 text-xl outline-none focus:ring-2 focus:ring-ring sm:text-2xl"/><div className="mt-5 flex justify-end"><button type="submit" className="rounded-full bg-red-600 px-7 py-3 font-semibold text-white">{freeform?'Finish':'Submit answer'}</button></div>{decision?.reason&&<p className="mt-5 text-sm text-muted-foreground">{decision.reason}</p>}</form>}
          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t pt-5"><button type="button" onClick={goBack} disabled={!history.length} className="rounded-full border px-5 py-2 text-sm font-semibold disabled:opacity-40">Back</button><button type="button" onClick={abandon} className="rounded-full border px-5 py-2 text-sm font-semibold">Abandon test</button></div>
        </> : <div className="flex min-h-[400px] flex-col justify-center"><p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">KEYWORDS READY</p><h2 className="mt-4 text-4xl font-semibold tracking-tight">Search terms collected.</h2><div className="mt-8 rounded-xl border bg-muted/20 p-5"><p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">GENERATED SEARCH TERMS</p><div className="mt-3 flex flex-wrap gap-2">{searchTerms.length?searchTerms.map(term=><span key={term} className="rounded-full border bg-background px-3 py-1 text-sm">{term}</span>):<span className="text-sm text-muted-foreground">No search terms supplied.</span>}</div></div><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={goBack} disabled={!history.length} className="rounded-full border px-6 py-3 font-semibold disabled:opacity-40">Back</button><button type="button" onClick={abandon} className="rounded-full border px-6 py-3 font-semibold">Abandon test</button><button type="button" onClick={reset} className="rounded-full border px-6 py-3 font-semibold">Run another test</button></div></div>}
      </main>
      <aside className="rounded-2xl border bg-muted/20 p-5"><p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">KEYWORDS RECORDED</p><div className="mt-4 space-y-4">{keywordGroups.length?keywordGroups.map(group=><div key={group.id}><p className="text-xs uppercase tracking-wide text-muted-foreground">{group.label}</p><p className="mt-1 break-words font-medium">{group.value}</p></div>):<p className="text-sm text-muted-foreground">No keywords yet.</p>}</div><div className="mt-6 border-t pt-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Search terms</p><div className="mt-3 flex flex-wrap gap-2">{searchTerms.map(term=><span key={term} className="rounded-full border bg-background px-2 py-1 text-xs">{term}</span>)}</div></div><div className="mt-6 border-t pt-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Answers recorded</p><div className="mt-3 space-y-3">{Object.entries(answers).map(([key,value])=><div key={key}><p className="text-xs text-muted-foreground">{LABELS[key]||key}</p><p className="mt-1 break-words text-sm">{clean(value)||'Unknown / skipped'}</p></div>)}</div></div></aside>
      <section className="rounded-2xl border bg-muted/20 p-5 md:col-span-2"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">DIAGNOSTICS</p><p className="mt-2 text-sm text-muted-foreground">Includes route choices, answers, generated keywords, decisions and the event log. No taxonomy output.</p>{copyStatus&&<p className="mt-2 text-sm" role="status">{copyStatus}</p>}</div><button type="button" onClick={copyDiagnostics} className="rounded-full border bg-background px-5 py-2 text-sm font-semibold">Copy diagnostics</button></div><pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-background p-4 text-xs leading-relaxed">{diagnostics}</pre></section>
    </div>
  </div></div>;
}
