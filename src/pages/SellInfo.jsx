import React from 'react';
import { Link } from 'react-router-dom';

const BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-red-700';

export default function SellInfo() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <main className="w-full max-w-2xl px-6 py-16">
        <h1 className="font-display text-3xl tracking-tight">
          Before you sell on S.O.B.S.
        </h1>

        <div className="mt-6 space-y-4 text-sm leading-6">
          <p>
            S.O.B.S. is not an anonymous marketplace.
          </p>

          <p>
            We need to know who our sellers are so we can prevent misuse,
            exclude sellers involved in unlawful activity, and cooperate with
            lawful requests from law enforcement.
          </p>

          <p>
            Buyers and sellers do not receive each other's personal
            information through S.O.B.S. unless they choose to share it
            themselves.
          </p>

          <p>
            To sell on S.O.B.S., you must complete seller verification and
            receive a unique S.O.B.S. seller ID.
          </p>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <Link
            to="/signup"
            className={BUTTON_CLASS}
          >
            Signup
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-foreground/30 px-6 py-2.5 font-semibold transition-colors hover:bg-foreground/5"
          >
            Back
          </Link>
        </div>
      </main>
    </div>
  );
}
