import React, { useMemo, useState } from 'react';
import {
  createInitialQuestion,
  evaluateNext,
  getMaxStructuredQuestions,
  getProfileName,
} from '../lib/adaptiveQuestionnaireEngine';

const MAX_QUESTIONS = getMaxStructuredQuestions();

function clean(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

const LABELS = {
  type: 'Type',
  description: 'Three-word description',
  identity: 'Identity / maker / model',
  year: 'Year or period',
  variant: 'Variant',
  condition: 'Condition',
  distinctive: 'Distinctive detail',
  colour: 'Colour',
  partNumber: 'Part / serial number',
  function: 'Function',
  fitment: 'Fits / parent item',
  artist: 'Artist / maker',
  workTitle: 'Work title',
  medium: 'Medium / material',
  originality: 'Originality',
  date: 'Date',
  association: 'Associated with',
  origin: 'Origin',
  period: 'Period',
  context: 'Additional context',
  edition: 'Edition / reference',
  size: 'Size / specification',
  freeform: 'Anything else',
};

export default function AdaptiveQuestionnaireTest() {
  const [answers, setAnswers] = useState({});
  const [askedIds, setAskedIds] = useState([]);
  const [structuredCount, setStructuredCount] = useState(0);
  const [current, setCurrent] = useState(createInitialQuestion());
  const [phase, setPhase] = useState('question');
  const [input, setInput] = useState('');
  const [decision, setDecision] = useState(null);
  const [diagnosticLog, setDiagnosticLog] = useState([]);

  const registrySummary = useMemo(
    () => Object.entries(answers).map(([key, value]) => ({
      key,
      value: clean(value) || 'Unknown / skipped',
    })),
    [answers],
  );

  const answerLabel = (key) => LABELS[key] || key;

  const submitAnswer = (event) => {
    event?.preventDefault();
    const value = clean(input);

    if (phase === 'freeform') {
      setAnswers((previous) => ({ ...previous, freeform: value }));
      setInput('');
      setPhase('complete');
      return;
    }

    const nextAnswers = { ...answers, [current.id]: value };
    const nextAskedIds = [...askedIds, current.id];
    const nextCount = structuredCount + 1;
    setAnswers(nextAnswers);
    setAskedIds(nextAskedIds);
    setStructuredCount(nextCount);
    setInput('');

    const result = evaluateNext(nextAnswers, nextAskedIds, nextCount);
    if (result.done) {
      setDecision(result);
      setCurrent({
        id: 'freeform',
        label: 'Anything you would like to add?',
        placeholder: 'Optional: add any other detail in your own words',
      });
      setPhase('freeform');
    } else {
      setDecision(result);
      setCurrent(result.question);
    }
  };

  const reset = () => {
    setAnswers({});
    setAskedIds([]);
    setStructuredCount(0);
    setCurrent(createInitialQuestion());
    setPhase('question');
    setInput('');
    setDecision(null);
    setDiagnosticLog([]);
  };

  const diagnostics = JSON.stringify({
    test: 'adaptive-questionnaire',
    maxStructuredQuestions: MAX_QUESTIONS,
    phase,
    structuredCount,
    currentQuestion: current,
    profile,
    destination,
    answers,
    askedIds,
    lastDecision: decision,
    log: diagnosticLog,
  }, null, 2);

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(diagnostics);
    } catch {
      // Clipboard access may be blocked by the browser; the output remains selectable below.
    }
  };

  const isComplete = phase === 'complete';
  const isFreeform = phase === 'freeform';
  const profile = decision?.profile;
  const destination = decision?.destination || (profile ? getProfileName(profile) : '');

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8">
        <div className="mb-10">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            S.O.B.S TEST
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            Adaptive item questionnaire
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            A deterministic local engine selects each question from the answers already given.
            No AI service or external API is used at runtime. “Don't know” or pressing Enter to
            skip is valid.
          </p>
        </div>

        <div className="grid flex-1 gap-8 md:grid-cols-[1fr_300px]">
          <main className="rounded-2xl border bg-background p-6 shadow-sm sm:p-10">
            {!isComplete ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    {isFreeform ? 'OPTIONAL FINAL STEP' : `STRUCTURED QUESTION ${structuredCount + 1} OF ${MAX_QUESTIONS}`}
                  </span>
                  {destination && (
                    <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                      {destination}
                    </span>
                  )}
                </div>

                <div className="mt-12 min-h-[150px]">
                  <p
                    key={current.id + '-' + structuredCount + '-' + phase}
                    className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl"
                  >
                    {current.label}
                  </p>
                  {isFreeform && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Structured questions have stopped. This final addition is optional and will
                      not trigger more questions.
                    </p>
                  )}
                </div>

                <form onSubmit={submitAnswer}>
                  <input
                    autoFocus
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={current.placeholder}
                    className="w-full rounded-xl border bg-background px-5 py-5 text-xl outline-none transition focus:ring-2 focus:ring-ring sm:text-2xl"
                  />
                  <div className="mt-5 flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      {isFreeform ? 'Press Enter to finish, or leave blank.' : 'Press Enter to answer or skip.'}
                    </span>
                    <button
                      type="submit"
                      className="rounded-full bg-red-600 px-7 py-3 font-semibold text-white"
                    >
                      {isFreeform ? 'Finish' : 'Next'}
                    </button>
                  </div>
                </form>

                {!isFreeform && (
                  <div className="mt-12 border-t pt-6">
                    <p className="text-sm font-semibold">Registry test</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      After every answer, the engine checks whether it has enough identifying
                      information to make the item searchable. It stops when its rules say the
                      information is sufficient, when no useful prompt remains, or at 12 structured
                      questions.
                    </p>
                    {decision?.reason && (
                      <p className="mt-3 text-sm">{decision.reason}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-[520px] flex-col justify-center">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  TEST COMPLETE
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                  Structured questions stopped.
                </h2>
                <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                  The engine retained the answers and offered one optional free-form addition.
                  This test does not create or publish a live listing.
                </p>
                <div className="mt-8 rounded-xl border bg-muted/20 p-5">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    REGISTRY DESTINATION
                  </p>
                  <p className="mt-3 text-xl font-semibold">{destination || 'Undetermined'}</p>
                  {decision?.reason && <p className="mt-2 text-sm text-muted-foreground">{decision.reason}</p>}
                </div>
                {answers.freeform && (
                  <div className="mt-5 rounded-xl border p-5">
                    <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                      FINAL ADDITION
                    </p>
                    <p className="mt-2 whitespace-pre-wrap">{answers.freeform}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={reset}
                  className="mt-8 w-fit rounded-full border px-6 py-3 font-semibold"
                >
                  Run another test
                </button>
              </div>
            )}
          </main>

          <section className="mt-8 rounded-2xl border bg-muted/20 p-5 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  DIAGNOSTICS
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Copy this output and paste it into the chat when something behaves incorrectly.
                </p>
              </div>
              <button
                type="button"
                onClick={copyDiagnostics}
                className="rounded-full border bg-background px-5 py-2 text-sm font-semibold"
              >
                Copy diagnostics
              </button>
            </div>
            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-background p-4 text-xs leading-relaxed">
              {diagnostics}
            </pre>
          </section>

          <aside className="rounded-2xl border bg-muted/20 p-5">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
              WHAT IT KNOWS
            </p>
            <div className="mt-5 space-y-4">
              {registrySummary.length ? (
                registrySummary.map(({ key, value }) => (
                  <div key={key}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {answerLabel(key)}
                    </p>
                    <p className="mt-1 break-words font-medium">{value}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing yet. Start with the broadest possible answer.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
