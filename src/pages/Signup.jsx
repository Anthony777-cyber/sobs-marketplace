import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createWorker } from 'tesseract.js';

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-white bg-black px-3 py-2.5 text-white outline-none placeholder:text-gray-400 focus:ring-0';

const BUTTON_CLASS =
  'rounded-full bg-red-600 px-6 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40';


function normalise(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function nameMatches(text, suppliedName) {
  const documentText = normalise(text);

  const tokens = normalise(suppliedName)
    .split(/\s+/)
    .filter((token) => token.length >= 2);

  return (
    tokens.length > 0 &&
    tokens.every((token) => documentText.includes(token))
  );
}

function cleanMrzLine(line) {
  return line
    .toUpperCase()
    .replace(/[^A-Z0-9<]/g, '');
}

function hasPassportMrz(text) {
  const lines = text
    .split(/\r?\n/)
    .map(cleanMrzLine)
    .filter(Boolean);

  for (let i = 0; i < lines.length - 1; i += 1) {
    const first = lines[i];
    const second = lines[i + 1];

    if (
      first.startsWith('P<') &&
      first.length >= 40 &&
      second.length >= 40
    ) {
      return true;
    }
  }

  return false;
}

function hasNationalIdMrz(text) {
  const lines = text
    .split(/\r?\n/)
    .map(cleanMrzLine)
    .filter(Boolean);

  for (let i = 0; i < lines.length - 1; i += 1) {
    const first = lines[i];
    const second = lines[i + 1];

    if (
      (first.startsWith('I<') || first.startsWith('ID')) &&
      first.length >= 25 &&
      second.length >= 25
    ) {
      return true;
    }
  }

  return false;
}

async function checkIdentityDocument(file, documentType, suppliedName) {
  if (
    !file ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  ) {
    return false;
  }

  const bitmap = await createImageBitmap(file);

  try {
    if (bitmap.width < 600 || bitmap.height < 350) {
      return false;
    }
  } finally {
    bitmap.close();
  }

  const worker = await createWorker('eng', 1, {
    logger: () => {},
  });

  try {
    const result = await worker.recognize(file);
    const text = result?.data?.text || '';

    if (!text.trim()) {
      return false;
    }

    const structureOk =
      documentType === 'passport'
        ? hasPassportMrz(text)
        : hasNationalIdMrz(text);

    if (!structureOk) {
      return false;
    }

    return nameMatches(text, suppliedName);
  } finally {
    await worker.terminate();
  }
}

export default function Signup() {
  const [step, setStep] = useState(0);
  const [termsRead, setTermsRead] = useState(false);

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [town, setTown] = useState('');
  const [region, setRegion] = useState('');
  const [postcode, setPostcode] = useState('');

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [idDocumentType, setIdDocumentType] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [idStatus, setIdStatus] = useState('idle');
  const [sellerLoginSecret, setSellerLoginSecret] = useState('');
  const idFileRef = useRef(null);

  const addressReady =
    fullName.trim() &&
    country.trim() &&
    street.trim() &&
    houseNumber.trim() &&
    town.trim();

  const phoneReady = phone.trim();
  const emailReady = email.trim();
  const idReady = idDocumentType && idFile;

  async function handleDocumentCheck() {
    const file = idFileRef.current || idFile;

    if (!file || !idDocumentType || idStatus === 'checking') {
      return;
    }

    setIdStatus('checking');

    try {
      const accepted = await checkIdentityDocument(
        file,
        idDocumentType,
        fullName
      );

      if (accepted) {
        const response = await fetch('/api/seller/signup', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            fullName,
            country,
            street,
            houseNumber,
            town,
            region,
            postcode,
            phone,
            email,
            idDocumentType,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !data?.seller?.id) {
          throw new Error(data?.error || 'Seller signup failed');
        }

        const sellerId = data.seller.id;
        const loginSecret = data.seller.loginSecret;

        if (!loginSecret) {
          throw new Error('Seller login secret was not returned');
        }

        setSellerLoginSecret(loginSecret);

        const content =
          `S.O.B.S seller credentials\n\n` +
          `YOUR UNIQUE INDIVIDUAL SOBS ID\n\n` +
          `${sellerId}\n\n` +
          `IMPORTANT — KEEP THIS CODE SAFE.\n\n` +
          `YOU NEED THIS CODE TO LOG INTO SOBS\n` +
          `THIS IS YOUR SOBS "USERNAME"\n` +
          `YOU ALSO NEED THIS CODE TO ACCESS YOUR MANAGEMENT CONSOLE\n` +
          `IT IS 1 OF 10 QUADRILLION POSSIBLE IDs\n`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `SOBS-seller-credentials-${sellerId}.txt`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);

        setStep(5);
      } else {
        setIdStatus('rejected');
      }
    } catch {
      setIdStatus('rejected');
    }
  }

  const handleDocumentButtonClick = (event) => {
    event.stopPropagation();

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }

    handleDocumentCheck();
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 py-10">
        {step === 0 && (
          <>
            <h1 className="font-display text-3xl tracking-tight">
              Before you sell on S.O.B.S.
            </h1>

            <div className="mt-6 space-y-3 text-base leading-6">
              <p>• S.O.B.S. is not an anonymous marketplace.</p>
              <p>• We need to know who our sellers are so we can prevent misuse.</p>
              <p>• To sell on S.O.B.S., you must complete seller verification and receive a unique S.O.B.S. seller ID.</p>
              <p>• Your identity information is treated as super confidential and encrypted.</p>
              <p>• Buyers will not see your personal details through S.O.B.S. unless you choose to share them yourself.</p>
              <p>• We do not sell your information.</p>
              <p>• S.O.B.S. does not permit stolen goods, drugs, fraud or other unlawful activity.</p>
              <p>• S.O.B.S. will cooperate with lawful legal and law-enforcement requests for information worldwide.</p>
              <p>• Your bank payment must match the seller details you provide or it will be rejected.</p>
            </div>

            <label className="mt-6 flex items-start gap-3 text-base">
              <input
                type="checkbox"
                checked={termsRead}
                onChange={(e) => setTermsRead(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0"
              />
              <span>I have read and agree to the terms above.</span>
            </label>

            <div className="mt-8 flex items-center gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={!termsRead}
                className={BUTTON_CLASS}
              >
                Continue
              </button>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-full border border-foreground/30 px-6 py-2.5 font-semibold transition-colors hover:bg-foreground/5"
              >
                Cancel
              </Link>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="font-display text-3xl tracking-tight">
              Your identity and address
            </h1>

            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Full name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={INPUT_CLASS}
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Country or territory
                </label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={INPUT_CLASS}
                  autoComplete="country-name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Street
                </label>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className={INPUT_CLASS}
                  autoComplete="address-line1"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  House number
                </label>
                <input
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Town / city / village
                </label>
                <input
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  className={INPUT_CLASS}
                  autoComplete="address-level2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Region / county
                </label>
                <input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={INPUT_CLASS}
                  autoComplete="address-level1"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Postcode
                </label>
                <input
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className={INPUT_CLASS}
                  autoComplete="postal-code"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!addressReady}
                className={`mt-4 ${BUTTON_CLASS}`}
              >
                Continue
              </button>
              <Link
                to="/"
                className="mt-4 inline-flex items-center justify-center rounded-full border border-foreground/30 px-6 py-2.5 font-semibold hover:bg-foreground/5"
              >
                Cancel
              </Link>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-display text-3xl tracking-tight">
              Your phone number
            </h1>

            <div className="mt-8">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className={INPUT_CLASS}
                autoComplete="tel"
              />

              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!phoneReady}
                className={`mt-6 ${BUTTON_CLASS}`}
              >
                Continue
              </button>
              <Link
                to="/"
                className="mt-4 inline-flex items-center justify-center rounded-full border border-foreground/30 px-6 py-2.5 font-semibold hover:bg-foreground/5"
              >
                Cancel
              </Link>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="font-display text-3xl tracking-tight">
              Your email address
            </h1>

            <div className="mt-8">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className={INPUT_CLASS}
                autoComplete="email"
              />

              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!emailReady}
                className={`mt-6 ${BUTTON_CLASS}`}
              >
                Continue
              </button>
              <Link
                to="/"
                className="mt-4 inline-flex items-center justify-center rounded-full border border-foreground/30 px-6 py-2.5 font-semibold hover:bg-foreground/5"
              >
                Cancel
              </Link>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="font-display text-3xl tracking-tight">
              Identity verification
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Upload your passport or national identity card.
            </p>

            <div className="mt-8">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Document type
                </label>

                <select
                  value={idDocumentType}
                  onChange={(e) => {
                    setIdDocumentType(e.target.value);
                    setIdStatus('idle');
                  }}
                  className={INPUT_CLASS}
                >
                  <option value="">Select document type</option>
                  <option value="passport">Passport</option>
                  <option value="national-id">National identity card</option>
                </select>
              </div>

              <div className="mt-5">
                <label className="mb-1 block text-sm font-medium">
                  Upload document
                </label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    idFileRef.current = file;
                    setIdFile(file);
                    setIdStatus('idle');
                  }}
                  className="block w-full text-sm"
                />
              </div>

              {idFile && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Selected: {idFile.name}
                </p>
              )}

              {idStatus === 'rejected' && (
                <p className="mt-4 text-sm text-red-500">
                  We could not accept that document. Please upload a clear
                  passport or national identity card.
                </p>
              )}

              <button
                type="button"
                onClick={handleDocumentButtonClick}
                disabled={!idFile || !idDocumentType || idStatus === 'checking'}
                className={`mt-6 ${BUTTON_CLASS}`}
              >
                {idStatus === 'checking' ? 'Checking...' : 'Continue'}
              </button>
              <Link
                to="/"
                className="mt-4 inline-flex items-center justify-center rounded-full border border-foreground/30 px-6 py-2.5 font-semibold hover:bg-foreground/5"
              >
                Cancel
              </Link>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="font-display text-3xl tracking-tight">
              Your S.O.B.S account
            </h1>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Your seller account has been created.
            </p>

            <div className="mt-8 rounded-lg border-2 border-white p-5">
              <p className="text-sm font-semibold">
                YOUR SOBS LOGIN SECRET
              </p>

              <p className="mt-3 break-all font-mono text-xl tracking-widest">
                {sellerLoginSecret}
              </p>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                IMPORTANT — KEEP THIS CODE SAFE.
                <br />
                You need this code together with your S.O.B.S ID to log into S.O.B.S.
              </p>

              <button
                type="button"
                onClick={() => {
                  const blob = new Blob(
                    [sellerLoginSecret + '\n'],
                    { type: 'text/plain;charset=utf-8' }
                  );
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement('a');
                  anchor.href = url;
                  anchor.download = 'SOBS-login-secret.txt';
                  document.body.appendChild(anchor);
                  anchor.click();
                  anchor.remove();
                  URL.revokeObjectURL(url);
                }}
                className={`mt-5 ${BUTTON_CLASS}`}
              >
                Download login secret
              </button>
            </div>

            <Link
              to="/"
              className={`mt-8 inline-flex ${BUTTON_CLASS}`}
            >
              Done
            </Link>
          </>
        )}

      </main>
    </div>
  );
}
