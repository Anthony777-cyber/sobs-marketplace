import React, { useMemo, useState } from 'react';
import NavBar from '@/components/NavBar';

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
  return value.trim().replace(/\s+/g, ' ');
}

function titleCaseFirst(value) {
  const s = clean(value);
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export default function CategoryTest() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    type: '',
    maker: '',
    model: '',
    year: '',
    part: '',
  });
  const [extra, setExtra] = useState('');
  const [finished, setFinished] = useState(false);

  const inQuestions = step < QUESTIONS.length;
  const question = inQuestions ? QUESTIONS[step] : null;

  const built = useMemo(() => {
    const parts = [
      titleCaseFirst(answers.type),
      titleCaseFirst(answers.maker),
      titleCaseFirst(answers.model),
      clean(answers.year),
      titleCaseFirst(answers.part),
      clean(extra),
    ].filter(Boolean);

    return {
      title: parts.join(' '),
      path: parts.join(' / '),
    };
  }, [answers, extra]);

  const updateAnswer = (value) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.key]: value }));
  };

  const next = () => {
    if (inQuestions) {
      setStep((n) => n + 1);
    }
  };

  const back = () => {
    if (finished) {
      setFinished(false);
      return;
    }

    setStep((n) => Math.max(0, n - 1));
  };

  const finish = () => {
    setFinished(true);
  };

  const reset = () => {
    setAnswers({
      type: '',
      maker: '',
      model: '',
      year: '',
      part: '',
    });
    setExtra('');
    setStep(0);
    setFinished(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            S.O.B.S. CATEGORY TEST
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">
            Let’s find out what this is.
          </h1>
          <p className="mt-1 text-muted-foreground">
            Give us whatever answers are useful. Skip anything that doesn't apply.
            This page does not create a listing.
          </p>
          <p className="mt-4 max-w-2xl text-sm italic text-muted-foreground">
            “The more accurate your answers with no spelling mistakes are, the easier it will be for buyers to find your ad and the better your chance of seeling... oh hold on, that's selling, right?”
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border p-5">
            {!finished && inQuestions && (
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
                  value={answers[question.key]}
                  onChange={(e) => updateAnswer(e.target.value)}
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
            )}

            {!finished && !inQuestions && (
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
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="Add any useful words, names, versions, descriptions, unusual details or search terms."
                  rows={5}
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
                    Finish
                  </button>
                </div>
              </>
            )}

            {finished && (
              <>
                <p className="text-lg font-medium">Done.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Nothing has been posted. This is only a test of the question flow.
                </p>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFinished(false)}
                    className="rounded-full border px-5 py-2.5 font-semibold"
                  >
                    Add more
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full bg-red-600 px-6 py-2.5 font-semibold text-white"
                  >
                    Start again
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border bg-muted/20 p-5">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              LIVE RESULT
            </p>

            <div className="mt-5">
              <p className="text-xs font-medium text-muted-foreground">
                LISTING TITLE
              </p>
              <p className="mt-1 min-h-6 text-lg font-medium">
                {built.title || 'Your title will build here.'}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-xs font-medium text-muted-foreground">
                INTERNAL CATEGORY PATH
              </p>
              <p className="mt-1 min-h-6 font-mono text-sm">
                {built.path || 'Your category structure will build here.'}
              </p>
            </div>

            <div className="mt-6 border-t pt-4 text-xs text-muted-foreground">
              The first questions establish the basic taxonomy. The final box is
              completely free-form and can contain as much extra searchable detail
              as the seller thinks is useful.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="mt-6 text-sm text-muted-foreground underline underline-offset-4"
        >
          Reset test
        </button>
      </div>
    </div>
  );
}
