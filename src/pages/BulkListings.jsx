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
    const warnings = [];
    const price = Number(item.price);
    const months = Number(item.months);

    if (!item.title) errors.push('Title is required');
    if (!item.description) warnings.push('Description is blank');
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
      warnings.push('No photo provided');
    }

    images.forEach((image) => {
      if (/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(image)) return;
      try {
        const parsed = new URL(image);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          warnings.push('Photo must be a public HTTP/HTTPS URL or embedded image file');
        }
      } catch {
        warnings.push('A photo is invalid');
      }
    });

    return {
      ...item,
      rowNumber: index + 2,
      errors,
      warnings,
      fee: Number.isInteger(months) && months > 0 ? months / 3 : 0,
    };
  });

  if (!rows.length) {
    return { error: 'The CSV contains headers but no listing rows.', rows: [] };
  }

  if (records.length > 101) {
    return {
      error: 'A spreadsheet can contain up to 101 rows total: one heading row and 100 listings.',
      rows,
    };
  }

  return { error: '', rows };
}


export default function BulkListings() {
  const navigate = useNavigate();
  const previewParams = new URLSearchParams(window.location.search);
  const previewUploadMeter = previewParams.get('previewUploadMeter') === '1' || previewParams.get('previewUploadFailure') === '1';
  const previewUploadFailure = previewParams.get('previewUploadFailure') === '1';
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
  const [uploadFailed, setUploadFailed] = useState(previewUploadFailure);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0, phase: '' });
  const [previewPercent, setPreviewPercent] = useState(0);
  const [previewRobotOff, setPreviewRobotOff] = useState(false);
  const [draftRows, setDraftRows] = useState({});
  const [activatedRows, setActivatedRows] = useState({});
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => {
    setHead('Bulk Uploads | S.O.B.S');
  }, []);

  useEffect(() => {
    if (!previewUploadMeter || submitting) return undefined;
    let percent = 0;
    let timer;
    const advance = () => {
      if (percent < 100) {
        percent = Math.min(100, percent + 2);
        setPreviewPercent(percent);
        timer = window.setTimeout(advance, 90);
        return;
      }
      timer = window.setTimeout(() => {
        setPreviewRobotOff(true);
        timer = window.setTimeout(() => {
          setPreviewRobotOff(false);
          percent = 0;
          setPreviewPercent(0);
          timer = window.setTimeout(advance, 250);
        }, 850);
      }, 700);
    };
    advance();
    return () => window.clearTimeout(timer);
  }, [previewUploadMeter, submitting]);

  useEffect(() => {
    if (!uploadFailed || previewUploadFailure) return undefined;
    const timer = window.setTimeout(() => setUploadFailed(false), 5200);
    return () => window.clearTimeout(timer);
  }, [uploadFailed, previewUploadFailure]);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setRows([]);
    setError('');
    setDraftRows({});
    setActivatedRows({});
    setSubmissionMessage('');
    setUploadProgress({ completed: 0, total: 0, phase: '' });

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
    setUploadFailed(false);
    setSubmissionMessage('');
    setUploadProgress({ completed: 0, total: pendingRows.length, phase: 'saving' });
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
        setUploadProgress({ completed: index + 1, total: pendingRows.length, phase: 'saving' });
      }
      allDraftsSaved = validRows.every((row) => stagedRows[row.rowNumber]);
      setSubmissionMessage(allDraftsSaved ? 'Drafts saved. Uploading the test listings…' : `${pendingRows.length} draft${pendingRows.length === 1 ? '' : 's'} saved.`);
    } catch (submitError) {
      setUploadFailed(true);
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
    setUploadFailed(false);
    setSubmissionMessage('');
    setUploadProgress({ completed: 0, total: listingIds.length, phase: 'publishing' });
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
      const skippedMessage = invalidRows.length
        ? ` ${invalidRows.length} row${invalidRows.length === 1 ? '' : 's'} with required-field errors skipped.`
        : '';
      const warningMessage = warningRows.length
        ? ` ${warningRows.length} uploaded row${warningRows.length === 1 ? '' : 's'} have warnings.`
        : '';
      setSubmissionMessage(`${listingIds.length} test listing${listingIds.length === 1 ? '' : 's'} uploaded. Payment is disabled during testing.${skippedMessage}${warningMessage}`);
    } catch (submitError) {
      setUploadFailed(true);
      setSubmissionMessage(submitError instanceof Error ? submitError.message : 'Batch submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const validRows = rows.filter((row) => row.errors.length === 0);
  const invalidRows = rows.filter((row) => row.errors.length > 0);
  const warningRows = rows.filter((row) => row.warnings.length > 0 && row.errors.length === 0);
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

  const meterPercent = previewUploadMeter && !submitting
    ? previewPercent
    : uploadProgress.phase === 'saving'
      ? Math.round((uploadProgress.completed / uploadProgress.total) * 100)
      : 100;

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
            Upload an Excel (.xlsx) file containing up to 100 listings plus one heading row (101 rows total). Embedded photos in Excel files are read from each item row.
          </p>

          <label className="mt-5 block" aria-live="polite">
            <span className="mb-2 block font-medium">Spreadsheet file</span>
            <span className="relative flex min-h-12 w-full max-w-xl items-center gap-3 rounded-lg bg-white/5 p-2">
              <input
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFile}
                aria-label="Choose spreadsheet file"
                className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              />
              <span className={`min-w-0 flex-1 truncate px-2 text-sm ${fileName ? 'text-white' : 'text-white/50'}`} title={fileName || 'No file selected'}>
                {fileName || 'No file selected'}
              </span>
              <span className="shrink-0 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold !text-black transition-colors peer-hover:bg-red-500 peer-active:bg-red-700 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-red-300">
                {fileName ? 'Chosen' : 'Choose file'}
              </span>
            </span>
          </label>

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

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-white/20 p-4">
                <p className="text-sm text-white/70">Total rows</p>
                <p className="mt-1 text-2xl font-bold">{rows.length}</p>
              </div>
              <div className="rounded-lg border border-white/20 p-4">
                <p className="text-sm text-white/70">Valid rows</p>
                <p className="mt-1 text-2xl font-bold">{validRows.length}</p>
              </div>
              <div className="rounded-lg border border-white/20 p-4">
                <p className="text-sm font-semibold text-red-400">Rows with errors</p>
                <p className="mt-1 text-2xl font-extrabold text-red-500">{invalidRows.length}</p>
              </div>
              <div className="rounded-lg border border-white/20 p-4">
                <p className="text-sm text-white/70">Rows with warnings</p>
                <p className="mt-1 text-2xl font-bold">{warningRows.length}</p>
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
                    <tr key={row.rowNumber} className={`border-b align-top ${row.errors.length ? 'border-red-500 bg-red-950/60' : 'border-white/15'}`}>
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
                          row.warnings.length ? (
                            <div className="rounded-md border border-red-500 bg-red-950 p-2 text-red-400">
                              <p className="mb-1 font-extrabold uppercase tracking-wide">Warning</p>
                              <ul className="list-disc pl-4 font-semibold">
                                {row.warnings.map((message, index) => (
                                  <li key={`${row.rowNumber}-warning-${index}`}>{message}</li>
                                ))}
                              </ul>
                            </div>
                          ) : <span className="text-green-300">Valid</span>
                        ) : (
                          <div className="rounded-md border border-red-500 bg-red-950 p-2 text-red-400">
                            <p className="mb-1 font-extrabold uppercase tracking-wide">Error</p>
                            <ul className="list-disc pl-4 font-semibold">
                              {row.errors.map((message, index) => (
                                <li key={`${row.rowNumber}-${index}`}>{message}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-5 rounded-lg border border-white/20 p-4 text-sm text-white/75">
              Payment is disabled for testing. Rows with required-field errors are skipped; rows with warnings can still be uploaded and will publish without collecting payment.
            </p>
            {submissionMessage && (
              <p role="status" className={`mt-4 rounded-lg border p-4 text-sm ${/failed|error|skipped/i.test(submissionMessage) ? 'border-red-500/70 text-red-300' : 'border-white/20 text-white/90'}`}>
                {submissionMessage}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={allDraftsStaged ? () => activateDrafts() : stageDrafts}
                disabled={submitting || validRows.length === 0 || allListingsActivated}
                className="shrink-0 rounded-full bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? 'Uploading test batch…' : allListingsActivated ? 'Test batch uploaded' : allDraftsStaged ? 'Retry test upload' : 'Upload valid listings'}
              </button>
              {(submitting && uploadProgress.total > 0 || previewUploadMeter || uploadFailed) && (
                <div className={`relative w-full min-w-0 overflow-hidden rounded-xl border bg-slate-950 p-4 shadow-[0_0_28px_rgba(34,211,238,0.12)] sm:max-w-xl ${uploadFailed ? 'border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'border-cyan-300/40'}`} aria-live="polite">
                  <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(103,232,249,.45) 1px, transparent 0)', backgroundSize: '22px 22px' }} />
                  <div className="relative">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.28em] ${uploadFailed ? 'text-red-300' : 'text-cyan-300'}`}>{uploadFailed ? previewUploadFailure ? 'S.O.B.S. • FAILURE PREVIEW' : 'S.O.B.S. • TRANSMISSION FAILED' : 'S.O.B.S. • BATCH TRANSMISSION'}</p>
                        <p className="mt-1 font-semibold text-white">
                          {uploadFailed ? previewUploadFailure ? 'Robot failure animation' : 'Robot needs a reboot!' : previewUploadMeter && !submitting ? 'Hyperdrive upload sequence' : uploadProgress.phase === 'publishing' ? 'Publishing test listings…' : 'Uploading test listings…'}
                        </p>
                      </div>
                      <span className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${uploadFailed ? 'border-red-300/40 bg-red-400/10 text-red-200' : 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200'}`}>
                        <span className={`h-2 w-2 rounded-full ${uploadFailed ? 'bg-red-400' : 'bg-cyan-300 upload-meter-glow'}`} /> {uploadFailed ? 'Failed' : previewUploadMeter && !submitting ? 'Preview' : 'Active'}
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={uploadProgress.phase === 'publishing' || previewUploadMeter && !submitting ? 'Uploading test listings' : 'Saving test listings'}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      {...(uploadProgress.phase === 'saving' || previewUploadMeter && !submitting ? { 'aria-valuenow': meterPercent } : {})}
                      className="relative h-12 overflow-hidden rounded-xl border border-cyan-200/30 bg-slate-900 shadow-inner shadow-black"
                    >
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-950 via-blue-800 to-cyan-900/70 transition-[width] duration-500 ease-out"
                      style={{ width: `${meterPercent}%` }}
                    />
                    <span className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(90deg, transparent 49%, rgba(103,232,249,.6) 50%, transparent 51%)', backgroundSize: '20px 100%' }} />
                    <div
                      className={`absolute bottom-0 z-10 h-[42px] w-[92px] transition-[left] duration-500 ease-out ${uploadFailed ? previewUploadFailure ? 'upload-robot-explode-preview' : 'upload-robot-explode' : previewRobotOff || uploadProgress.phase === 'saving' && meterPercent >= 100 ? 'upload-robot-exit' : previewUploadMeter && !submitting || uploadProgress.phase === 'saving' ? 'upload-robot-walk' : 'upload-robot-travel upload-robot-walk'}`}
                      style={previewUploadMeter && !submitting || uploadProgress.phase === 'saving' ? { left: `calc(${meterPercent}% - ${Math.round(92 * meterPercent / 100)}px)` } : undefined}
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 100 44" className="h-full w-full overflow-visible drop-shadow-[0_0_7px_rgba(34,211,238,0.65)]">
                        <path d="M36 24 C47 22 52 28 62 27" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 2" />
                        <path d="M14 7 H28 L36 15 V36 H14 Z" fill="#e0f2fe" stroke="#67e8f9" strokeWidth="1.7" />
                        <path d="M28 7 V15 H36" fill="#7dd3fc" stroke="#67e8f9" strokeWidth="1.4" />
                        <path d="M19 21 H31 M19 25 H31 M19 29 H29" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M68 22 L63 25 L68 28 M88 22 L94 25 L90 28" fill="none" stroke="#a5f3fc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="67" y="15" width="22" height="20" rx="5" fill="#0e7490" stroke="#a5f3fc" strokeWidth="2" />
                        <rect x="70" y="4" width="19" height="15" rx="4" fill="#cffafe" stroke="#22d3ee" strokeWidth="2" />
                        <path d="M74 4 V2 L79 0 L83 3" fill="none" stroke="#67e8f9" strokeWidth="1.5" />
                        <circle cx="80" cy="1.5" r="1.5" fill="#facc15" />
                        <path d="M74 8 H86" stroke="#67e8f9" strokeWidth="1" opacity=".8" />
                        <circle cx="75" cy="11" r="2" fill="#2563eb" />
                        <circle cx="84" cy="11" r="2" fill="#2563eb" />
                        <path d="M77 16 Q80 18 83 16" fill="none" stroke="#0891b2" strokeWidth="1.5" />
                        <rect x="72" y="22" width="12" height="8" rx="2" fill="#082f49" stroke="#22d3ee" strokeWidth="1" />
                        <circle cx="76" cy="26" r="1.5" fill="#facc15" />
                        <circle cx="81" cy="26" r="1.5" fill="#4ade80" />
                        <path d="M72 34 L69 39 M84 34 L87 39" stroke="#a5f3fc" strokeWidth="3" strokeLinecap="round" />
                        <rect x="65" y="38" width="7" height="3" rx="1.5" fill="#22d3ee" />
                        <rect x="85" y="38" width="7" height="3" rx="1.5" fill="#22d3ee" />
                      </svg>
                      {uploadFailed && (
                        <svg viewBox="0 0 40 40" className={`${previewUploadFailure ? 'upload-explosion-preview' : 'upload-explosion-burst'} absolute left-7 top-0 h-10 w-10`}>
                          <path d="M20 1 24 11 35 6 31 17 40 20 30 25 36 36 24 31 19 40 16 29 4 34 9 23 0 18 12 16 8 5 18 11Z" fill="#f97316" stroke="#fef08a" strokeWidth="2" />
                          <circle cx="20" cy="20" r="5" fill="#fde047" />
                        </svg>
                      )}
                    </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-cyan-100/70">
                      <span>{uploadProgress.phase === 'saving' && !previewUploadMeter ? `${uploadProgress.completed} / ${uploadProgress.total} records` : previewUploadMeter && !submitting ? 'File delivery sequence' : 'Secure channel established'}</span>
                      <span>{uploadProgress.phase === 'saving' || previewUploadMeter && !submitting ? `${meterPercent}%` : 'Transmitting'}</span>
                    </div>
                    <p className="mt-3 text-xs text-white/65">Keep this page open while the batch is being processed.</p>
                  </div>
                </div>
              )}
            </div>
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

