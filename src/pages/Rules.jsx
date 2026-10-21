import { Link } from "react-router-dom";

export default function Rules() {
  return (
    <div className="rules-page min-h-screen p-6">
      <div className="relative mx-auto max-w-3xl">
        <Link
          to="/"
          aria-label="Exit"
          className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-2xl font-bold leading-none text-white"
        >
          ×
        </Link>

        <h1 className="mb-6 text-3xl font-bold">S.O.B.S Rules</h1>

        <div className="space-y-6 whitespace-pre-line leading-relaxed">
          <section className="space-y-4 rounded-2xl border-8 border-[#cccccc] p-4 text-neutral-300">
            <h2 className="text-xl font-bold">What S.O.B.S does</h2>

            <ul className="list-disc space-y-2 pl-6">
            <li>S.O.B.S provides a place to advertise old, broken, unwanted, unusual, interesting, anything basically.</li>
            <li>Sellers describe and advertise their own items, with a little help from us.</li>
            <li>Buyers contact sellers directly.</li>
            <li>Buyers and sellers arrange the sale between themselves.</li>
            <li>S.O.B.S provides the listing for our fee, but takes none of the sale profit.</li>
            <li>S.O.B.S provides a downvote button to help users keep the site clean.</li>
            <li>S.O.B.S gives absolute zero friction to buyers and browsers. No Sign-Up, No Passwords, No Cookies. You are free to come and go without hindrance and interact with buyers as you please. You don't need a password to read a classified newspaper ad or enter a shop. So why should you need one here?</li>
            <li>But to become a seller on S.O.B.S, you must be registered, verified, and known to us, as we are not the Dark Web, are not privacy/anonymity absolutists, and will positively engage with law enforcement should they legally and lawfully request it.</li>
            <li>S.O.B.S gives a week's grace for you to renew or recover your ad after the term you paid for has lapsed. After that, gone is gone. You are responsible for the maintenance of your ads.</li>
              <li>S.O.B.S welcomes sellers with bulk uploads and provides facilities for achieving that.</li>
            </ul>
          </section>

          <section className="space-y-4 rounded-2xl border-8 border-[#cccccc] p-4 text-neutral-300">
            <h2 className="text-xl font-bold">What S.O.B.S does not do</h2>

            <ul className="list-disc space-y-2 pl-6">
            <li>S.O.B.S does not buy or sell your stuff.</li>
            <li>S.O.B.S does not negotiate sales between buyers and sellers.</li>
            <li>S.O.B.S does not handle the money for a sale between buyer and seller.</li>
            <li>S.O.B.S does not provide escrow.</li>
            <li>S.O.B.S does not arrange delivery or shipping.</li>
            <li>S.O.B.S does not guarantee that an item exists, works, or is exactly as described.</li>
            <li>S.O.B.S does not police whether something is fashionable, useful, ugly, obsolete, or just plain weird.</li>
            <li>S.O.B.S does not adjudicate disputes between buyers and sellers and vice versa. That is what the courts and the Police are for.</li>
            <li>S.O.B.S does not act as an agent for either the buyer or the seller.</li>
            </ul>
          </section>

          <section className="space-y-4 rounded-2xl border-8 border-[#cccccc] p-4 text-neutral-300">
            <h2 className="text-xl font-bold text-neutral-300">What you must not do</h2>

            <ul className="rules-prohibited-list list-disc space-y-2 pl-6">
            <li>Sell or promote illegal goods or services.</li>
            <li>Commit fraud or deliberately mislead others.</li>
            <li>Make threats or harass other users.</li>
            <li>Upload malware or attempt to compromise the S.O.B.S site.</li>
            <li>Facilitate serious criminal activity.</li>
            <li>Deliberately disrupt or abuse the service.</li>
            <li>S.O.B.S will remove listings that break these rules or cause problems for the site.</li>
            <li>S.O.B.S is not a criminal free-for-all.</li>
            </ul>
          </section>

          <section className="space-y-4 rounded-2xl border-8 border-[#cccccc] p-4 text-neutral-300">
            <h2 className="text-xl font-bold">In short</h2>

            <ul className="list-disc space-y-2 pl-6">
            <li>If it's legal, old, broken, unwanted, unusual, or interesting, it belongs here.</li>
            <li>Be honest about what you're selling.</li>
            <li>Deal directly with the other person.</li>
            <li>Use some basic manners.</li>
            <li>So if it's against the law, then don't bring it here. Refunds will not be given for illegal or offensive ads removed. So we advise against advertising illegal things, as your ad won't last long, and as a seller, you are known to us. If you continuously contravene our very simple terms, we will block you from using the site permanently and reserve the right to do so.</li>
          </ul>

            <div className="flex flex-wrap items-center gap-4">
              <p className="font-bold">Manners maketh man.</p>
              <a href="https://s-o-b-s.vercel.app/" className="rules-contact-link inline-flex items-center rounded-full border-2 border-white bg-black px-5 py-2 font-semibold transition-colors hover:bg-neutral-900">
                Contact
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
