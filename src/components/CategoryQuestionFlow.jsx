import React from 'react';

const QUESTIONS = [
  {
    key: 'type',
    label: 'What would you say it is?',
    placeholder: 'e.g. Car, Book, Radio, Scrimshaw',
  },
  {
    key: 'maker',
    label: 'Who made it?',
    placeholder: 'If known — e.g. Audi, Sony, Tolkien',
  },
  {
    key: 'model',
    label: 'What model, name or type is it?',
    placeholder: 'e.g. GT Coupe Turbo Quattro, The Lord of the Rings',
  },
  {
    key: 'year',
    label: 'What year is it?',
    placeholder: 'If known — e.g. 1986',
  },
  {
    key: 'part',
    label: 'What is the actual item or part?',
    placeholder: 'e.g. Wheels, Gearbox, First Edition, Carving',
  },
];

function clean(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function firstCap(value) {
  const s = clean(value);
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function buildTerms(flow) {
  return [
    firstCap(flow.answers?.type),
    firstCap(flow.answers?.maker),
    firstCap(flow.answers?.model),
    clean(flow.answers?.year),
    firstCap(flow.answers?.part),
    clean(flow.extra),
  ].filter(Boolean);
}

export default function CategoryQuestionFlow({ value, onChange, onFinish, onClose }) {
  const step = Number(value?.step || 0);
  const answers = value?.answers || {};
  const extra = value?.extra || '';
  const inQuestions = step < QUESTIONS.length;
  const question = inQuestions ? QUESTIONS[step] : null;
  const terms = buildTerms(value || {});

  const setAnswer = (field, answer) => {
    onChange({
      ...(value || {}),
      step,
      complete: false,
      answers: {
        ...answers,
        [field]: answer,
      },
      extra,
    });
  };

  const next = () => {
    onChange({
      ...(value || {}),
      step: Math.min(step + 1, QUESTIONS.length),
      complete: false,
      answers,
      extra,
    });
  };

  const back = () => {
    onChange({
      ...(value || {}),
      step: Math.max(step - 1, 0),
      complete: false,
      answers,
      extra,
    });
  };

  const finish = () => {
    onFinish({
      ...(value || {}),
      step: QUESTIONS.length,
      complete: true,
      answers,
      extra,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-3xl rounded-2xl border bg-background shadow-2xl">
          <div className="border-b px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  LET'S GET STARTED
                </p>
                <h2 className="mt-1 font-display text-2xl tracking-tight">
                  Let’s find out what this is.
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border px-3 py-1.5 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Give us whatever answers are useful. Skip anything that doesn't apply.
            </p>

            <p className="mt-3 max-w-2xl text-sm italic text-muted-foreground">
              “The more accurate your answers with no spelling mistakes are, the easier it will be for buyers to find your ad and the better your chance of seeling... oh hold on, that's selling, right?”
            </p>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              {inQuestions ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      QUESTION {step + 1} OF {QUESTIONS.length}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Optional
                    </span>
                  </div>

                  <label className="mt-6 block text-lg font-medium">
                    {question.label}
                  </label>

                  <input
                    autoFocus
                    value={answers[question.key] || ''}
                    onChange={(e) => setAnswer(question.key, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        next();
                      }
                    }}
                    placeholder={question.placeholder}
                    className="mt-3 w-full rounded-lg border bg-background px-3 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
                  />

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={back}
                      disabled={step === 0}
                      className="rounded-full border px-5 py-2.5 font-semibold disabled:opacity-30"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={next}
                      className="rounded-full bg-red-600 px-6 py-2.5 font-semibold text-white"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      EXTRA SEARCH TERMS
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Free form
                    </span>
                  </div>

                  <label className="mt-6 block text-lg font-medium">
                    Anything else that would help someone find it?
                  </label>

                  <textarea
                    autoFocus
                    value={extra}
                    onChange={(e) =>
                      onChange({
                        ...(value || {}),
                        step,
                        complete: false,
                        answers,
                        extra: e.target.value,
                      })
                    }
                    placeholder="Anything useful: names, versions, unusual details, search terms..."
                    rows={6}
                    className="mt-3 w-full rounded-lg border bg-background px-3 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
                  />

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={back}
                      className="rounded-full border px-5 py-2.5 font-semibold"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={finish}
                      className="rounded-full bg-red-600 px-6 py-2.5 font-semibold text-white"
                    >
                      End
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-xl border bg-muted/20 p-5">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                TITLE PREVIEW
              </p>

              <p className="mt-4 min-h-14 text-lg font-medium">
                {terms.join(' ') || 'Your listing title will build here.'}
              </p>

              <p className="mt-6 text-xs text-muted-foreground">
                S.O.B.S. keeps the category structure behind the scenes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
