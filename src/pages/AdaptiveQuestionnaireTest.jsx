import React, { useMemo, useState } from 'react';
import {
  buildKeywordGroups,
  buildSearchTerms,
  createInitialQuestion,
  evaluateNext,
  getMaxStructuredQuestions,
} from '../lib/adaptiveQuestionnaireEngine';

const MAX_QUESTIONS = getMaxStructuredQuestions();

function clean(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

const LABELS = {
  description: 'What it is',
  category: 'Item category',
  type: 'Narrower type',
  feature: 'Feature / distinguishing detail',
  identification: 'Identification and description',
  freeform: 'Anything else to add',
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
  const [copyStatus, setCopyStatus] = useState('');

  const registrySummary = useMemo(
    () => Object.entries(answers).map(([key, value]) => ({
      key,
      value: clean(value) || 'Unknown / skipped',
    })),
    [answers],
  );

  const keywordGroups = useMemo(() => buildKeywordGroups(answers), [answers]);
  const searchTerms = useMemo(() => buildSearchTerms(answers), [answers]);

  const answerLabel = (key) => LABELS[key] || key;

  const submitAnswer = (event) => {
    event?.preventDefault();
    const value = clean(input);

    if (phase === 'freeform') {
      const nextAnswers = { ...answers, freeform: value };
      setAnswers(nextAnswers);
      setInput('');
      setPhase('complete');
      setDiagnosticLog((previous) => [
        ...previous,
        {
          event: 'final-addition-recorded',
          questionId: 'freeform',
          answer: value || 'Skipped',
          moreStructuredQuestionsAsked: false,
          keywordGroups: buildKeywordGroups(nextAnswers),
          searchTerms: buildSearchTerms(nextAnswers),
        },
      ]);
      return;
    }

    const nextAnswers = { ...answers, [current.id]: value };
    const nextAskedIds = [...new Set([...askedIds, current.id])];
    const nextCount = structuredCount + 1;
    const result = evaluateNext(nextAnswers, nextAskedIds, nextCount);

    setAnswers(nextAnswers);
    setAskedIds(nextAskedIds);
    setStructuredCount(nextCount);
    setInput('');
    setDecision(result);
    setDiagnosticLog((previous) => [
      ...previous,
      {
        event: 'answer-recorded',
        questionId: current.id,
        question: current.label,
        answer: value || 'Unknown / skipped',
        structuredCount: nextCount,
      },
      {
        event: result.done ? 'structured-questions-stopped' : 'next-question-selected',
        nextQuestionId: result.done ? 'freeform' : result.question.id,
        reason: result.reason,
        keywordGroups: result.keywordGroups,
        searchTerms: result.searchTerms,
        taxonomyTerms: result.taxonomyTerms,
      },
    ]);

    if (result.done) {
      setCurrent({
        id: 'freeform',
        label: 'Do you have anything else to add?',
        placeholder: 'Optional: add any other useful search terms',
      });
      setPhase('freeform');
    } else {
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
    setCopyStatus('');
  };

  const isComplete = phase === 'complete';
  const isFreeform = phase === 'freeform';

  const diagnostics = JSON.stringify({
    test: 'adaptive-keyword-sifter',
    purpose: 'Guide the seller to provide useful search keywords; do not attempt exhaustive item identification.',
    maxStructuredQuestions: MAX_QUESTIONS,
    target: 'Fewest useful questions; 12 structured questions is the hard ceiling, not the goal.',
    phase,
    structuredCount,
    currentQuestion: current,
    destination: 'Registry',
    answers,
    askedIds,
    keywordGroups,
    searchTerms,
    lastDecision: decision,
    log: diagnosticLog,
  }, null, 2);

  const copyDiagnostics = async () => {
    setCopyStatus('');

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(diagnostics);
      setCopyStatus('Diagnostics copied.');
      return;
    } catch {
      // Try the legacy copy command for contexts where Clipboard API is blocked.
    }

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
      area.style.padding = '0';
      area.style.opacity = '0.01';
      document.body.appendChild(area);
      area.focus();
      area.select();
      area.setSelectionRange(0, area.value.length);
      const copied = document.execCommand('copy');
      area.remove();

      if (copied) {
        setCopyStatus('Diagnostics copied.');
        return;
      }
      throw new Error('Legacy copy command returned false');
    } catch {
      area?.remove();
      setCopyStatus('Automatic copy was blocked. Select the diagnostic text below and press Ctrl+C.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8">
        <div className="mb-10">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            S.O.B.S TEST
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            Adaptive keyword Sifter
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            The Sifter guides the seller from a broad category to a narrower type and useful
            features. It asks only for missing details, then offers one final optional addition.
            The resulting words support search; the pictures help buyers recognise the item.
          </p>
        </div>

        <div className="grid flex-1 gap-8 md:grid-cols-[1fr_300px]">
          <main className="rounded-2xl border bg-background p-6 shadow-sm sm:p-10">
            {!isComplete ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    {isFreeform
                      ? 'OPTIONAL FINAL STEP'
                      : 'STRUCTURED QUESTION ' + (structuredCount + 1) + ' OF ' + MAX_QUESTIONS}
                  </span>
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    Registry
                  </span>
                </div>

                <div className="mt-12 min-h-[150px]">
                  <p
                    key={current.id + '-' + structuredCount + '-' + phase}
                    className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl"
                  >
                    {current.label}
                  </p>
                  {isFreeform && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      This is the final question. Add any further keywords you think buyers might
                      use. No more structured questions will follow.
                    </p>
                  )}
                </div>

                <form onSubmit={submitAnswer}>
                  {current.options ? (
                    <select
                      autoFocus
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      className="w-full rounded-xl border bg-background px-5 py-5 text-xl outline-none transition focus:ring-2 focus:ring-ring sm:text-2xl"
                      required
                    >
                      <option value="" disabled>Choose one</option>
                      {current.options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      autoFocus
                      spellCheck={true}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder={current.placeholder}
                      className="w-full rounded-xl border bg-background px-5 py-5 text-xl outline-none transition focus:ring-2 focus:ring-ring sm:text-2xl"
                    />
                  )}
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
                    <p className="text-sm font-semibold">Search keyword builder</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      It asks only for useful missing information. Twelve structured questions is
                      the hard limit, not the target. The final optional addition is outside that limit.
                    </p>
                    {decision?.reason && <p className="mt-3 text-sm">{decision.reason}</p>}
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-[520px] flex-col justify-center">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  KEYWORDS READY
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                  Search terms collected.
                </h2>
                <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                  The keywords help buyers find the listing. Its pictures help them recognise the
                  particular item.
                </p>
                <div className="mt-8 rounded-xl border bg-muted/20 p-5">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    SEARCH TERMS CREATED
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {searchTerms.length ? searchTerms.map((term) => (
                      <span key={term} className="rounded-full border bg-background px-3 py-1 text-sm">
                        {term}
                      </span>
                    )) : <span className="text-sm text-muted-foreground">No search terms supplied.</span>}
                  </div>
                </div>
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

          <aside className="rounded-2xl border bg-muted/20 p-5">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
              KEYWORDS RECORDED
            </p>
            <div className="mt-4 space-y-4">
              {keywordGroups.length ? keywordGroups.map((group) => (
                <div key={group.id}>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  <p className="mt-1 break-words font-medium">{group.value}</p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">
                  Nothing yet. Start with a broad category such as lamp, chair, or book.
                </p>
              )}
            </div>
            <div className="mt-6 border-t pt-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Search terms</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {searchTerms.length ? searchTerms.map((term) => (
                  <span key={term} className="rounded-full border bg-background px-2 py-1 text-xs">
                    {term}
                  </span>
                )) : <span className="text-sm text-muted-foreground">None yet</span>}
              </div>
            </div>
            <div className="mt-6 border-t pt-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Answers recorded</p>
              <div className="mt-3 space-y-3">
                {registrySummary.length ? registrySummary.map(({ key, value }) => (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground">{answerLabel(key)}</p>
                    <p className="mt-1 break-words text-sm">{value}</p>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No answers yet</p>
                )}
              </div>
            </div>
          </aside>

          <section className="rounded-2xl border bg-muted/20 p-5 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  DIAGNOSTICS
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Output includes the answers, resulting keywords, next decision, and a log of every
                  question/answer transition.
                </p>
                {copyStatus && (
                  <p className="mt-2 text-sm" role="status" aria-live="polite">{copyStatus}</p>
                )}
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
        </div>
      </div>
    </div>
  );
}
