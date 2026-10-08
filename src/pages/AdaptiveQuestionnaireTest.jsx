import React, { useMemo, useState } from 'react';

const MAX_QUESTIONS = 12;

function clean(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function firstWord(value) {
  return clean(value).split(/\s+/)[0]?.toLowerCase() || '';
}

function classifyBase(type) {
  const t = firstWord(type);

  if (['car', 'vehicle', 'van', 'motorbike', 'motorcycle', 'truck', 'tractor'].includes(t)) {
    return 'machine';
  }

  if (['art', 'painting', 'sculpture', 'print', 'drawing', 'photograph'].includes(t)) {
    return 'art';
  }

  return 'odd';
}

const FLOWS = {
  machine: [
    {
      id: 'q2',
      label: 'Describe it further in THREE words.',
      placeholder: 'e.g. Audi GT Coupe',
    },
    {
      id: 'year',
      label: 'What year is it?',
      placeholder: 'If known — or press Enter if you do not know',
    },
    {
      id: 'colour',
      label: 'What colour is it?',
      placeholder: 'If known — or press Enter if you do not know',
    },
    {
      id: 'state',
      label: 'What is the state of the vehicle?',
      placeholder: 'e.g. Running, not running, restoration',
    },
  ],
  art: [
    {
      id: 'q2',
      label: 'Describe it further in THREE words.',
      placeholder: 'e.g. Landscape by Monet',
    },
    {
      id: 'artist',
      label: 'Who is the artist?',
      placeholder: 'If known — or press Enter if unknown',
    },
    {
      id: 'year',
      label: 'What year is it?',
      placeholder: 'If known — or press Enter if unknown',
    },
    {
      id: 'medium',
      label: 'What is the medium?',
      placeholder: 'e.g. Oil on canvas, bronze, print',
    },
  ],
  odd: [
    {
      id: 'q2',
      label: 'Describe it further in THREE words.',
      placeholder: 'Three words that describe it',
    },
    {
      id: 'use',
      label: 'What is it, or what was it used for?',
      placeholder: 'If known — or press Enter if unknown',
    },
    {
      id: 'associated',
      label: 'What is it associated with?',
      placeholder: 'A machine, person, place, event, etc.',
    },
    {
      id: 'distinctive',
      label: 'What makes it distinctive?',
      placeholder: 'Anything unusual or identifying',
    },
  ],
};

export default function AdaptiveQuestionnaireTest() {
  const [answers, setAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [input, setInput] = useState('');

  const base = answers.type ? classifyBase(answers.type) : null;
  const flow = base ? FLOWS[base] : [];
  const current = questionIndex === 0
    ? {
        id: 'type',
        label: 'Describe what your item is in ONE word.',
        placeholder: 'e.g. Car, Painting, Machine, Book',
      }
    : flow[questionIndex - 1];

  const questionNumber = questionIndex + 1;

  const registrySummary = useMemo(() => {
    return Object.entries(answers)
      .filter(([, value]) => clean(value))
      .map(([key, value]) => ({ key, value: clean(value) }));
  }, [answers]);

  const registryReady = () => {
    if (!answers.type) return false;
    if (base === 'machine') return Boolean(answers.q2 && answers.year && answers.colour && answers.state);
    if (base === 'art') return Boolean(answers.q2 && answers.artist && answers.year);
    return Boolean(answers.q2 && answers.use && answers.distinctive);
  };

  const submitAnswer = () => {
    const value = clean(input);

    setAnswers((previous) => ({
      ...previous,
      [current.id]: value,
    }));

    setInput('');

    const nextAnswers = { ...answers, [current.id]: value };

    if (questionIndex === 0) {
      setQuestionIndex(1);
      return;
    }

    const nextReady =
      current.id !== 'type' &&
      (() => {
        if (!nextAnswers.type) return false;
        const nextBase = classifyBase(nextAnswers.type);
        if (nextBase === 'machine') {
          return Boolean(nextAnswers.q2 && nextAnswers.year && nextAnswers.colour && nextAnswers.state);
        }
        if (nextBase === 'art') {
          return Boolean(nextAnswers.q2 && nextAnswers.artist && nextAnswers.year);
        }
        return Boolean(nextAnswers.q2 && nextAnswers.use && nextAnswers.distinctive);
      })();

    if (nextReady || questionNumber >= MAX_QUESTIONS) {
      setComplete(true);
      return;
    }

    setQuestionIndex((index) => index + 1);
  };

  const reset = () => {
    setAnswers({});
    setQuestionIndex(0);
    setComplete(false);
    setInput('');
  };

  const answerLabel = (key) => {
    const labels = {
      type: 'Type',
      q2: 'Description',
      year: 'Year',
      colour: 'Colour',
      state: 'State',
      artist: 'Artist',
      medium: 'Medium',
      use: 'Use',
      associated: 'Associated with',
      distinctive: 'Distinctive feature',
    };
    return labels[key] || key;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-8 sm:px-8">
        <div className="mb-10">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            S.O.B.S. TEST
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            Adaptive item questionnaire
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            The machine asks the fewest questions needed to make an item useful in the registry.
            “Don't know” or simply pressing Enter is a valid answer.
          </p>
        </div>

        <div className="grid flex-1 gap-8 md:grid-cols-[1fr_300px]">
          <main className="rounded-2xl border bg-background p-6 shadow-sm sm:p-10">
            {!complete ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    QUESTION {questionNumber} OF {MAX_QUESTIONS}
                  </span>
                  {base && (
                    <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                      {base}
                    </span>
                  )}
                </div>

                <div className="mt-12 min-h-[150px]">
                  <p
                    key={current.id + '-' + questionIndex}
                    className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl"
                  >
                    {current.label}
                  </p>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitAnswer();
                  }}
                >
                  <input
                    autoFocus
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={current.placeholder}
                    className="w-full rounded-xl border bg-background px-5 py-5 text-xl outline-none transition focus:ring-2 focus:ring-ring sm:text-2xl"
                  />

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      Press Enter to answer or skip.
                    </span>
                    <button
                      type="submit"
                      className="rounded-full bg-red-600 px-7 py-3 font-semibold text-white"
                    >
                      Next
                    </button>
                  </div>
                </form>

                <div className="mt-12 border-t pt-6">
                  <p className="text-sm font-semibold">
                    Registry test
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    After every answer the machine asks itself: “Do I have enough to list this
                    in the registry where it will be easily found and cross-referenced?”
                  </p>
                </div>
              </>
            ) : (
              <div className="flex min-h-[520px] flex-col justify-center">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  REGISTRY SUFFICIENT
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                  Enough. Stop asking questions.
                </h2>
                <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                  The structured interrogation has finished. The real listing would now move to
                  the free-form “Anything you'd like to add?” stage.
                </p>
                <div className="mt-8 rounded-xl border bg-muted/20 p-5">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    REGISTRY DESTINATION
                  </p>
                  <p className="mt-3 text-xl font-semibold">
                    {base === 'odd' ? 'And now for something completely different.' : base}
                  </p>
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
              WHAT IT KNOWS
            </p>

            <div className="mt-5 space-y-4">
              {registrySummary.length ? (
                registrySummary.map(({ key, value }) => (
                  <div key={key}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {answerLabel(key)}
                    </p>
                    <p className="mt-1 font-medium">{value || 'Unknown'}</p>
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
