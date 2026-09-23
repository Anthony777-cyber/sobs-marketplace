import { Link } from "react-router-dom";

export default function Rules() {
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold">S.O.B.S. Rules</h1>

        <div className="space-y-6 whitespace-pre-line leading-relaxed">
          <p>
            S.O.B.S. is a place to advertise old, broken, unusual, unwanted
            and otherwise interesting stuff.
          </p>

          <p>
            S.O.B.S. provides the advertising space and lets buyers and sellers
            contact each other. S.O.B.S. does not take part in the sale.
          </p>

          <p>
            S.O.B.S. does not handle payments, provide escrow, arrange
            shipping, negotiate sales, or guarantee that an item exists,
            works, or has been accurately described.
          </p>

          <p>
            S.O.B.S. does not police taste. Weird, ugly, obsolete, broken or
            unusual is fine. If it is legal, it can be advertised.
          </p>

          <p>
            S.O.B.S. is not a criminal free-for-all.
          </p>

          <p>
            Do not advertise illegal goods or services, fraud, threats,
            harassment, malware, attempts to compromise the site, serious
            criminal activity, or deliberate disruption.
          </p>

          <p>
            If it is illegal, don't advertise it here.
          </p>

          <p>
            Use some basic manners. Manners maketh man.
          </p>
        </div>

        <Link
          to="/"
          className="mt-8 inline-block rounded-md border px-6 py-3"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
