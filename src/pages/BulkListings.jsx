import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { setHead } from '@/lib/head';
import { ArrowLeft, Download, FileSpreadsheet, Upload } from 'lucide-react';

const HEADERS = [
  'title',
  'description',
  'price',
  'currency',
  'categoryPath',
  'months',
  'image1',
  'image2',
  'image3',
];

function parseCsv(text) {
  const records = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== '')) records.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== '')) records.push(row);
  }

  return records;
}

async function readXlsxEntries(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) { end = offset; break; }
  }
  if (end < 0) throw new Error('The Excel workbook is not a valid .xlsx file.');
  const entryCount = view.getUint16(end + 10, true);
  let directoryOffset = view.getUint32(end + 16, true);
  const entries = new Map();

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(directoryOffset, true) !== 0x02014b50) throw new Error('The Excel workbook directory is invalid.');
    const method = view.getUint16(directoryOffset + 10, true);
    const compressedSize = view.getUint32(directoryOffset + 20, true);
    const nameLength = view.getUint16(directoryOffset + 28, true);
    const extraLength = view.getUint16(directoryOffset + 30, true);
    const commentLength = view.getUint16(directoryOffset + 32, true);
    const localOffset = view.getUint32(directoryOffset + 42, true);
    const name = new TextDecoder().decode(bytes.slice(directoryOffset + 46, directoryOffset + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataOffset, dataOffset + compressedSize);
    let content;

    if (method === 0) content = compressed;
    else if (method === 8 && typeof DecompressionStream !== 'undefined') {
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      content = new Uint8Array(await new Response(stream).arrayBuffer());
    } else throw new Error('This Excel compression format is not supported by this browser.');

    entries.set(name, content);
    directoryOffset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function normalizeZipPath(path) {
  const parts = [];
  path.split('/').forEach((part) => {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  });
  return parts.join('/');
}

function xmlPart(entries, path) {
  const bytes = entries.get(path);
  if (!bytes) return null;
  const document = new DOMParser().parseFromString(new TextDecoder().decode(bytes), 'application/xml');
  if (document.querySelector('parsererror')) throw new Error(`The Excel workbook contains invalid XML (${path}).`);
  return document;
}

function excelColumnIndex(reference) {
  const letters = reference.match(/^[A-Z]+/i)?.[0]?.toUpperCase() || '';
  return [...letters].reduce((index, letter) => index * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function base64FromBytes(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function parseXlsx(file) {
  const entries = await readXlsxEntries(file);
  const sharedDocument = xmlPart(entries, 'xl/sharedStrings.xml');
  const sharedStrings = sharedDocument
    ? [...sharedDocument.getElementsByTagNameNS('*', 'si')].map((item) => [...item.getElementsByTagNameNS('*', 't')].map((node) => node.textContent || '').join(''))
    : [];
  const sheetPath = 'xl/worksheets/sheet1.xml';
  const sheet = xmlPart(entries, sheetPath);
  if (!sheet) throw new Error('The Excel workbook has no readable first worksheet.');
  const recordsByRow = new Map();
  const worksheetRows = [...sheet.getElementsByTagNameNS('*', 'row')];

  worksheetRows.forEach((row) => {
    const rowNumber = Number(row.getAttribute('r'));
    const cells = [];
    [...row.getElementsByTagNameNS('*', 'c')].forEach((cell) => {
      const column = excelColumnIndex(cell.getAttribute('r') || 'A1');
      const type = cell.getAttribute('t');
      let value = '';
      if (type === 'inlineStr') value = [...cell.getElementsByTagNameNS('*', 't')].map((node) => node.textContent || '').join('');
      else {
        const raw = cell.getElementsByTagNameNS('*', 'v')[0]?.textContent || '';
        value = type === 's' ? sharedStrings[Number(raw)] || '' : raw;
      }
      cells[column] = value;
    });
    recordsByRow.set(rowNumber, cells);
  });

  const header = recordsByRow.get(1) || [];
  if (!header.length) throw new Error('The first worksheet has no header row.');
  const headers = header.map((value) => String(value || '').trim());
  const rows = [...recordsByRow.entries()].filter(([rowNumber]) => rowNumber > 1).sort(([a], [b]) => a - b);
  const records = rows.map(([rowNumber, cells]) => {
    const record = {};
    headers.forEach((name, index) => { if (name) record[name] = cells[index] ?? ''; });
    record.__sheetRow = rowNumber;
    return record;
  });
  const recordBySheetRow = new Map(records.map((record) => [record.__sheetRow, record]));

  const sheetRels = xmlPart(entries, 'xl/worksheets/_rels/sheet1.xml.rels');
  const drawingRel = sheetRels && [...sheetRels.getElementsByTagNameNS('*', 'Relationship')].find((rel) => rel.getAttribute('Type')?.endsWith('/drawing'));
  if (drawingRel) {
    const drawingPath = normalizeZipPath(`xl/worksheets/${drawingRel.getAttribute('Target')}`);
    const drawing = xmlPart(entries, drawingPath);
    const drawingRelsPath = normalizeZipPath(`${drawingPath.slice(0, drawingPath.lastIndexOf('/') + 1)}_rels/${drawingPath.split('/').at(-1)}.rels`);
    const drawingRels = xmlPart(entries, drawingRelsPath);
    const relationshipTargets = new Map(drawingRels ? [...drawingRels.getElementsByTagNameNS('*', 'Relationship')].map((rel) => [rel.getAttribute('Id'), normalizeZipPath(`${drawingPath.slice(0, drawingPath.lastIndexOf('/') + 1)}${rel.getAttribute('Target')}`)]) : []);
    const ns = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
    [...(drawing?.getElementsByTagNameNS(ns, 'twoCellAnchor') || []), ...(drawing?.getElementsByTagNameNS(ns, 'oneCellAnchor') || [])].forEach((anchor) => {
      const from = anchor.getElementsByTagNameNS(ns, 'from')[0];
      const rowIndex = Number(from?.getElementsByTagNameNS(ns, 'row')[0]?.textContent || -1) + 1;
      const columnIndex = Number(from?.getElementsByTagNameNS(ns, 'col')[0]?.textContent || -1);
      const imageCell = headers[columnIndex];
      const record = recordBySheetRow.get(rowIndex);
      const embedId = anchor.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'blip')[0]?.getAttribute('r:embed')
        || anchor.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'blip')[0]?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed');
      const imagePath = relationshipTargets.get(embedId);
      const imageBytes = imagePath && entries.get(imagePath);
      if (!record || !['image1', 'image2', 'image3'].includes(imageCell) || !imageBytes) return;
      const extension = imagePath.split('.').pop().toLowerCase();
      const mime = ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', bmp: 'image/bmp' })[extension];
      if (mime) record[imageCell] = `data:${mime};base64,${base64FromBytes(imageBytes)}`;
    });
  }

  return [headers, ...records.map((record) => {
    const values = headers.map((name) => record[name] ?? '');
    return values;
  })];
}

function validateRows(records) {
  if (!records.length) {
    return { error: 'The CSV file is empty.', rows: [] };
  }

  const headers = records[0].map((header) => header.trim().replace(/^\uFEFF/, ''));
  const missing = HEADERS.filter((header) => !headers.includes(header));

  if (missing.length) {
    return {
      error: `Missing required columns: ${missing.join(', ')}`,
      rows: [],
    };
  }

  const rows = records.slice(1).map((cells, index) => {
    const item = {};

    headers.forEach((header, columnIndex) => {
      item[header] = (cells[columnIndex] ?? '').trim();
    });

    const errors = [];
    const price = Number(item.price);
    const months = Number(item.months);

    if (!item.title) errors.push('Title is required');
    if (!item.description) errors.push('Description is required');
    if (!item.price || !Number.isFinite(price) || price <= 0) {
      errors.push('Price must be greater than zero');
    }
    if (!item.currency) errors.push('Currency is required');
    if (!item.categoryPath) errors.push('Category path is required');
    if (!Number.isInteger(months) || months < 3 || months % 3 !== 0) {
      errors.push('Months must be a positive multiple of 3');
    }

    const images = [item.image1, item.image2, item.image3].filter(Boolean);
    if (!images.length) {
      errors.push('At least one photo is required');
    }

    images.forEach((image) => {
      if (/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(image)) return;
      try {
        const parsed = new URL(image);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          errors.push('Photos must be public HTTP/HTTPS URLs or embedded image files');
        }
      } catch {
        errors.push('A photo is invalid');
      }
    });

    return {
      ...item,
      rowNumber: index + 2,
      errors,
      fee: Number.isInteger(months) && months > 0 ? months / 3 : 0,
    };
  });

  if (!rows.length) {
    return { error: 'The CSV contains headers but no listing rows.', rows: [] };
  }

  if (rows.length > 100) {
    return {
      error: 'A maximum of 100 listings can be previewed in one upload.',
      rows,
    };
  }

  return { error: '', rows };
}


export default function BulkListings() {
  const navigate = useNavigate();
  const [builderDownloaded, setBuilderDownloaded] = useState(false);
  const [builderDownloading, setBuilderDownloading] = useState(false);
  const [builderDownloadError, setBuilderDownloadError] = useState('');
  const [templateDownloaded, setTemplateDownloaded] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [templateDownloadError, setTemplateDownloadError] = useState('');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [draftRows, setDraftRows] = useState({});
  const [activatedRows, setActivatedRows] = useState({});
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => {
    setHead('Bulk Uploads | S.O.B.S');
  }, []);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setRows([]);
    setError('');
    setDraftRows({});
    setActivatedRows({});
    setSubmissionMessage('');
    setUploadProgress({ completed: 0, total: 0 });

    const isExcel = file.name.toLowerCase().endsWith('.xlsx');
    if (!isExcel && !file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV or Excel (.xlsx) spreadsheet.');
      event.target.value = '';
      return;
    }

    setLoading(true);

    try {
      const records = isExcel ? await parseXlsx(file) : parseCsv(await file.text());
      const result = validateRows(records);
      setError(result.error);
      setRows(result.rows);
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : 'The file could not be read. Check the file and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function stageDrafts() {
    if (invalidRows.length) return;

    const globalKey = sessionStorage.getItem('sobs_global_user_key')?.trim();
    if (!globalKey) {
      setSubmissionMessage('Verified seller login is required before listings can be submitted.');
      return;
    }

    const pendingRows = validRows.filter((row) => !draftRows[row.rowNumber]);
    if (!pendingRows.length) {
      return activateDrafts(draftRows);
    }

    setSubmitting(true);
    setSubmissionMessage('');
    setUploadProgress({ completed: 0, total: pendingRows.length });
    const stagedRows = { ...draftRows };

    let allDraftsSaved = false;
    try {
      for (let index = 0; index < pendingRows.length; index += 1) {
        const row = pendingRows[index];
        const response = await fetch('/api/listings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SOBS-Global-Key': globalKey,
            'X-SOBS-Seller-Session': sessionStorage.getItem('sobs_seller_session_token') || '',
          },
          body: JSON.stringify({
            draft: true,
            title: row.title,
            description: row.description,
            price: Number(row.price),
            currency: row.currency,
            categoryPath: row.categoryPath,
            images: [row.image1, row.image2, row.image3].filter(Boolean),
            months: Number(row.months),
            paymentAmount: Number(row.months) / 3,
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(`Spreadsheet row ${row.rowNumber}: ${result.error || `listing upload failed (${response.status})`}`);
        }

        stagedRows[row.rowNumber] = result.listing || {};
        setDraftRows({ ...stagedRows });
        setUploadProgress({ completed: index + 1, total: pendingRows.length });
      }
      allDraftsSaved = validRows.every((row) => stagedRows[row.rowNumber]);
      setSubmissionMessage(allDraftsSaved ? 'Drafts saved. Uploading the test listings…' : `${pendingRows.length} draft${pendingRows.length === 1 ? '' : 's'} saved.`);
    } catch (submitError) {
      const stagedNow = Object.keys(stagedRows).filter((rowNumber) => !draftRows[rowNumber]).length;
      setSubmissionMessage(`${submitError instanceof Error ? submitError.message : 'Upload failed.'} ${stagedNow} draft${stagedNow === 1 ? '' : 's'} saved before the error. You can retry; saved drafts will be skipped.`);
      return;
    } finally {
      setSubmitting(false);
    }

    if (allDraftsSaved) await activateDrafts(stagedRows);
  }

  async function activateDrafts(stagedDraftRows = draftRows) {
    const globalKey = sessionStorage.getItem('sobs_global_user_key')?.trim();
    if (!globalKey) {
      setSubmissionMessage('Verified seller login is required before submitting the batch.');
      return;
    }

    const listingIds = validRows.map((row) => stagedDraftRows[row.rowNumber]?.id).filter(Boolean);
    if (listingIds.length !== validRows.length) {
      setSubmissionMessage('Some rows are not staged yet. Retry the upload to finish the test batch.');
      return;
    }

    setSubmitting(true);
    setSubmissionMessage('');
    try {
      const response = await fetch('/api/listings/bulk-drafts/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SOBS-Global-Key': globalKey,
          'X-SOBS-Seller-Session': sessionStorage.getItem('sobs_seller_session_token') || '',
        },
        body: JSON.stringify({ listingIds }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Batch submission failed (${response.status})`);

      const activated = {};
      result.listings?.forEach((listing) => {
        const row = validRows.find((candidate) => stagedDraftRows[candidate.rowNumber]?.id === listing.id);
        if (row) activated[row.rowNumber] = listing;
      });
      setActivatedRows((previous) => ({ ...previous, ...activated }));
      setSubmissionMessage(`${listingIds.length} test listing${listingIds.length === 1 ? '' : 's'} uploaded. Payment is disabled during testing.`);
    } catch (submitError) {
      setSubmissionMessage(submitError instanceof Error ? submitError.message : 'Batch submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const validRows = rows.filter((row) => row.errors.length === 0);
  const invalidRows = rows.filter((row) => row.errors.length > 0);
  const totalFees = validRows.reduce((sum, row) => sum + row.fee, 0);
  const allDraftsStaged = validRows.length > 0 && validRows.every((row) => draftRows[row.rowNumber]);
  const allListingsActivated = validRows.length > 0 && validRows.every((row) => activatedRows[row.rowNumber]);

  async function handleDownloadBuilder() {
    setBuilderDownloading(true);
    setBuilderDownloadError('');
    setBuilderDownloaded(false);

    try {
      const response = await fetch(`/downloads/SOBS-BSB.zip?download=${Date.now()}`);
      if (!response.ok) throw new Error('Builder download failed.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'SOBS-BSB-v2.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      setBuilderDownloaded(true);
    } catch {
      setBuilderDownloadError('Could not download BSB v2. Please try again.');
    } finally {
      setBuilderDownloading(false);
    }
  }

  async function handleDownloadTemplate() {
    setTemplateDownloading(true);
    setTemplateDownloadError('');
    setTemplateDownloaded(false);

    try {
      const response = await fetch('/downloads/SOBS-BSB-Blank-Template.xlsx');
      if (!response.ok) throw new Error('Template download failed.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'SOBS-BSB-Blank-Template.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      setTemplateDownloaded(true);
    } catch {
      setTemplateDownloadError('Could not download the Excel template. Please try again.');
    } finally {
      setTemplateDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <button
          type="button"
          onClick={() => navigate('/manage/console')}
          className="mb-6 inline-flex items-center justify-center gap-2 rounded-full border border-red-600 bg-red-600 px-4 py-2 text-black hover:border-red-500 hover:bg-red-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Management Console
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Bulk Uploads</h1>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
          >
            How to use
          </button>
        </div>

        <p className="mt-2 text-white/75">
          Prepare multiple S.O.B.S listings in a spreadsheet and check them
          before submission.
        </p>


        <section className="mt-8 rounded-xl border border-white/30 p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <FileSpreadsheet className="h-5 w-5" />
            1. Prepare your upload
          </h2>

          <p className="mt-3 text-sm text-white/75">
            Download S.O.B.S. BSB v2 to help with the task, or use the spreadsheet if that's your thing.
          </p>

          <button
            type="button"
            onClick={handleDownloadBuilder}
            disabled={builderDownloading}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 active:bg-white active:text-black disabled:opacity-60"
          >
            <Download className="h-5 w-5" />
            {builderDownloaded ? 'Downloaded' : builderDownloading ? 'Downloading…' : 'Download S.O.B.S. BSB v2'}
          </button>
          {builderDownloadError && <p role="alert" className="mt-3 text-sm text-red-300">{builderDownloadError}</p>}

          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={templateDownloading}
            className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-white px-4 py-2.5 font-semibold hover:bg-black hover:text-white active:bg-black active:text-white disabled:opacity-60"
          >
            <Download className="h-5 w-5" />
            {templateDownloaded ? 'Downloaded' : templateDownloading ? 'Downloading…' : 'Download Excel Template (.xlsx)'}
          </button>
          {templateDownloadError && <p role="alert" className="mt-3 text-sm text-red-300">{templateDownloadError}</p>}
        </section>

        <section className="mt-6 rounded-xl border border-white/30 p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Upload className="h-5 w-5" />
            2. Upload your spreadsheet
          </h2>

          <p className="mt-3 text-sm text-white/75">
            Upload an Excel (.xlsx) file containing up to 100 listings. Embedded photos in Excel files are read from each item row.
          </p>

          <label className="mt-5 block">
            <span className="mb-2 block font-medium">Spreadsheet file</span>
            <input
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFile}
              className="block w-full max-w-xl rounded-lg border border-white/30 p-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-semibold file:text-black"
            />
          </label>

          {fileName && (
            <p className="mt-3 text-sm text-white/75">Selected: {fileName}</p>
          )}

          {loading && <p className="mt-3">Reading spreadsheet...</p>}

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-500 p-3 text-red-300">
              {error}
            </p>
          )}
        </section>

        {rows.length > 0 && (
          <section className="mt-6 rounded-xl border border-white/30 p-5">
            <h2 className="text-xl font-semibold">3. Review listings</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/20 p-4">
                <p className="text-sm text-white/70">Total rows</p>
                <p className="mt-1 text-2xl font-bold">{rows.length}</p>
              </div>
              <div className="rounded-lg border border-white/20 p-4">
                <p className="text-sm text-white/70">Valid rows</p>
                <p className="mt-1 text-2xl font-bold">{validRows.length}</p>
              </div>
              <div className="rounded-lg border border-white/20 p-4">
                <p className="text-sm text-white/70">Rows with errors</p>
                <p className="mt-1 text-2xl font-bold">{invalidRows.length}</p>
              </div>
            </div>

            <p className="mt-4">
              Estimated fees for valid rows (not collected during testing):{' '}
              <strong>€{totalFees.toFixed(2)}</strong>
            </p>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/30">
                    <th className="p-3">Spreadsheet row</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Estimated fee</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.rowNumber} className="border-b border-white/15 align-top">
                      <td className="p-3">{row.rowNumber}</td>
                      <td className="p-3">{row.title || '(missing title)'}</td>
                      <td className="p-3">
                        {row.price || '—'} {row.currency}
                      </td>
                      <td className="p-3">{row.months ? `${row.months} months` : '—'}</td>
                      <td className="p-3">
                        {row.fee ? `€${row.fee.toFixed(2)}` : '—'}
                      </td>
                      <td className="p-3">
                        {activatedRows[row.rowNumber] ? (
                          <span className="text-sky-300">Test listing uploaded</span>
                        ) : draftRows[row.rowNumber] ? (
                          <span className="text-amber-200">Draft ready for test upload</span>
                        ) : row.errors.length === 0 ? (
                          <span className="text-green-300">Valid</span>
                        ) : (
                          <ul className="list-disc pl-4 text-red-300">
                            {row.errors.map((message, index) => (
                              <li key={`${row.rowNumber}-${index}`}>{message}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-5 rounded-lg border border-white/20 p-4 text-sm text-white/75">
              Payment is disabled for testing. Uploading this batch will publish the listings without collecting payment.
            </p>
            {submissionMessage && (
              <p role="status" className="mt-4 rounded-lg border border-white/20 p-4 text-sm text-white/90">
                {submitting && uploadProgress.total ? `Saving ${uploadProgress.completed} of ${uploadProgress.total} drafts... ` : ''}{submissionMessage}
              </p>
            )}
            <button
              type="button"
              onClick={allDraftsStaged ? () => activateDrafts() : stageDrafts}
              disabled={submitting || invalidRows.length > 0 || validRows.length === 0 || allListingsActivated}
              className="mt-5 rounded-full bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Uploading test batch…' : allListingsActivated ? 'Test batch uploaded' : allDraftsStaged ? 'Retry test upload' : `Upload ${validRows.length} test listing${validRows.length === 1 ? '' : 's'}`}
            </button>
          </section>
        )}
        {helpOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setHelpOpen(false)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="bulk-upload-help-title"
              className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/30 bg-black p-6 text-white shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Close help"
                className="absolute right-4 top-4 rounded-full border border-white/40 px-3 py-1 hover:bg-white hover:text-black"
              >
                Close
              </button>

              <h2 id="bulk-upload-help-title" className="pr-20 text-2xl font-bold">
                Bulk Upload
              </h2>

              <p className="mt-4 font-semibold">
                Best for large batches of items within the same category.
              </p>

              <p className="mt-2">
                Bulk Upload uses the S.O.B.S Sifter to classify your items and reduce repetitive data entry.
              </p>

              <h3 className="mt-5 font-semibold">When should you use it?</h3>

              <ul className="mt-3 list-disc space-y-3 pl-5">
                <li>
                  <strong>Lots of similar items:</strong> Upload a spreadsheet of car parts, tools, household goods or other items within the same category. The Sifter can apply the appropriate taxonomy across the batch.
                </li>
                <li>
                  <strong>A mixed collection of unrelated items:</strong> Bulk Upload may not save you time because different categories require different classification. Consider listing the items individually on the site instead.
                </li>
                <li>
                  <strong>Just a few items:</strong> Use the normal S.O.B.S Sifter to create your listings individually.
                </li>
              </ul>

              <p className="mt-5">
                <strong>Before you start:</strong> Group similar items together so the Sifter can classify them consistently. Bulk Upload is designed to reduce repetitive work, not to sort an unorganised inventory for you.
              </p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

