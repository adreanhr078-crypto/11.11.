#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  access,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createCanvas,
  DOMMatrix,
  ImageData,
  Path2D,
} from '@napi-rs/canvas';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = resolve(SCRIPT_DIRECTORY, '../..');
const PUBLIC_MANHWA_DIRECTORY = resolve(PROJECT_DIRECTORY, 'public/manhwa');

export const MANHWA_PUBLICATION_ID = 'echo-network-final-2026-09-v1';
export const MANHWA_SOURCE_FILE_NAME = '11.11_Echo_Network_Manhwa_FINAL_ORDERED_NO_DUPLICATES.pdf';
export const MANHWA_SOURCE_SHA256 = '6BE33FDD8A66210302AA44ED56D854B544F7A8B4C62AA57108557438571BFF1C';
export const MANHWA_PAGE_COUNT = 70;
export const MANHWA_CANVAS_WIDTH = 1800;
export const MANHWA_CANVAS_HEIGHT = 2700;
export const MANHWA_BACKGROUND = '#03040a';

const DEFAULT_SOURCE_PATH = `C:\\Users\\yasmo\\Downloads\\${MANHWA_SOURCE_FILE_NAME}`;
const DEFAULT_OUTPUT_DIRECTORY = resolve(PUBLIC_MANHWA_DIRECTORY, MANHWA_PUBLICATION_ID);
const OUTPUT_FILE_NAME = 'publication-manifest.json';

function printUsage() {
  console.log(`
Usage:
  npm run manhwa:import -- --source "C:\\path\\to\\${MANHWA_SOURCE_FILE_NAME}"

Options:
  --source <path>  Source PDF. Defaults to ELEVEN_ELEVEN_MANHWA_SOURCE or this workstation's approved PDF.
  --output <path>  Output directory. Only public/manhwa/${MANHWA_PUBLICATION_ID} is accepted.
  --replace        Explicitly replace a previous import of this exact publication.
  --clean-staging  Remove only abandoned staging directories for this exact publication.
  --help           Show this message.
`);
}

function readOption(argumentsList, option) {
  const index = argumentsList.indexOf(option);

  if (index === -1) {
    return undefined;
  }

  const value = argumentsList[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${option} requires a value.`);
  }

  return value;
}

function parseArguments(argumentsList) {
  if (argumentsList.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  const supported = new Set(['--source', '--output', '--replace', '--clean-staging']);
  for (const argument of argumentsList) {
    if (argument.startsWith('--') && !supported.has(argument)) {
      throw new Error(`Unknown option: ${argument}`);
    }
  }

  return {
    source: readOption(argumentsList, '--source')
      ?? process.env.ELEVEN_ELEVEN_MANHWA_SOURCE
      ?? DEFAULT_SOURCE_PATH,
    output: readOption(argumentsList, '--output') ?? DEFAULT_OUTPUT_DIRECTORY,
    replace: argumentsList.includes('--replace'),
    cleanStaging: argumentsList.includes('--clean-staging'),
  };
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function assertApprovedOutputDirectory(outputDirectory) {
  const resolvedOutput = resolve(outputDirectory);
  const relativeOutput = relative(PUBLIC_MANHWA_DIRECTORY, resolvedOutput);

  if (
    relativeOutput === ''
    || relativeOutput.startsWith('..')
    || isAbsolute(relativeOutput)
    || relativeOutput !== MANHWA_PUBLICATION_ID
  ) {
    throw new Error(
      `Output must be exactly ${DEFAULT_OUTPUT_DIRECTORY}. Refusing to write outside the versioned publication directory.`,
    );
  }

  return resolvedOutput;
}

function padPageNumber(pageNumber) {
  return String(pageNumber).padStart(3, '0');
}

function pageFileName(pageNumber) {
  return `page-${padPageNumber(pageNumber)}.webp`;
}

async function cleanAbandonedStagingDirectories() {
  const prefix = `.${MANHWA_PUBLICATION_ID}.import-`;
  const entries = await readdir(PUBLIC_MANHWA_DIRECTORY, {
    withFileTypes: true,
  });
  const stagingDirectories = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
    .map((entry) => resolve(PUBLIC_MANHWA_DIRECTORY, entry.name));

  for (const stagingDirectory of stagingDirectories) {
    assertApprovedOutputDirectory(DEFAULT_OUTPUT_DIRECTORY);
    const relativeStagingDirectory = relative(PUBLIC_MANHWA_DIRECTORY, stagingDirectory);
    if (!relativeStagingDirectory.startsWith(prefix) || relativeStagingDirectory.includes('..')) {
      throw new Error(`Refusing to clean an unexpected staging directory: ${stagingDirectory}`);
    }
    await rm(stagingDirectory, { recursive: true, force: false });
  }

  return stagingDirectories;
}

function installPdfJsCanvasGlobals() {
  if (!globalThis.DOMMatrix) {
    globalThis.DOMMatrix = DOMMatrix;
  }

  if (!globalThis.ImageData) {
    globalThis.ImageData = ImageData;
  }

  if (!globalThis.Path2D) {
    globalThis.Path2D = Path2D;
  }
}

async function loadPdf(sourceBytes) {
  installPdfJsCanvasGlobals();
  const { getDocument, version } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = getDocument({
    data: new Uint8Array(sourceBytes),
    disableFontFace: true,
    disableRange: true,
    disableStream: true,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  return {
    document: await loadingTask.promise,
    destroy: () => loadingTask.destroy(),
    pdfJsVersion: version,
  };
}

async function renderPage(pdfDocument, pageNumber, outputDirectory) {
  const page = await pdfDocument.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const fitScale = Math.min(
    MANHWA_CANVAS_WIDTH / baseViewport.width,
    MANHWA_CANVAS_HEIGHT / baseViewport.height,
  );
  const renderScale = Math.max(2, fitScale * 1.5);
  const renderViewport = page.getViewport({ scale: renderScale });

  const sourceCanvas = createCanvas(
    Math.ceil(renderViewport.width),
    Math.ceil(renderViewport.height),
  );
  const sourceContext = sourceCanvas.getContext('2d');
  await page.render({
    canvasContext: sourceContext,
    viewport: renderViewport,
  }).promise;

  const outputCanvas = createCanvas(MANHWA_CANVAS_WIDTH, MANHWA_CANVAS_HEIGHT);
  const outputContext = outputCanvas.getContext('2d');
  outputContext.fillStyle = MANHWA_BACKGROUND;
  outputContext.fillRect(0, 0, MANHWA_CANVAS_WIDTH, MANHWA_CANVAS_HEIGHT);
  outputContext.imageSmoothingEnabled = true;
  outputContext.imageSmoothingQuality = 'high';

  const outputScale = Math.min(
    MANHWA_CANVAS_WIDTH / sourceCanvas.width,
    MANHWA_CANVAS_HEIGHT / sourceCanvas.height,
  );
  const drawWidth = sourceCanvas.width * outputScale;
  const drawHeight = sourceCanvas.height * outputScale;
  outputContext.drawImage(
    sourceCanvas,
    (MANHWA_CANVAS_WIDTH - drawWidth) / 2,
    (MANHWA_CANVAS_HEIGHT - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );

  const fileName = pageFileName(pageNumber);
  const outputPath = join(outputDirectory, fileName);
  const outputBytes = await outputCanvas.encode('webp', 90);
  await writeFile(outputPath, outputBytes);

  page.cleanup();

  return {
    pageNumber,
    file: fileName,
    sha256: sha256(outputBytes),
    bytes: outputBytes.byteLength,
    sourcePage: {
      width: Math.round(baseViewport.width),
      height: Math.round(baseViewport.height),
    },
  };
}

async function importPublication() {
  const options = parseArguments(process.argv.slice(2));
  if (options.cleanStaging) {
    const removed = await cleanAbandonedStagingDirectories();
    console.log(JSON.stringify({
      ok: true,
      publicationId: MANHWA_PUBLICATION_ID,
      removedStagingDirectories: removed,
    }, null, 2));
    return;
  }

  const sourcePath = resolve(options.source);
  const outputDirectory = assertApprovedOutputDirectory(options.output);

  if (!(await pathExists(sourcePath))) {
    throw new Error(`Source PDF does not exist: ${sourcePath}`);
  }

  const sourceStats = await stat(sourcePath);
  if (!sourceStats.isFile()) {
    throw new Error(`Source path is not a file: ${sourcePath}`);
  }

  const sourceBytes = await readFile(sourcePath);
  const sourceSha256 = sha256(sourceBytes);
  if (sourceSha256 !== MANHWA_SOURCE_SHA256) {
    throw new Error(
      `Unexpected source PDF SHA256. Expected ${MANHWA_SOURCE_SHA256}, received ${sourceSha256}.`,
    );
  }

  const pdf = await loadPdf(sourceBytes);
  if (pdf.document.numPages !== MANHWA_PAGE_COUNT) {
    await pdf.destroy();
    throw new Error(
      `Unexpected PDF page count. Expected ${MANHWA_PAGE_COUNT}, received ${pdf.document.numPages}.`,
    );
  }

  const outputAlreadyExists = await pathExists(outputDirectory);
  if (outputAlreadyExists && !options.replace) {
    await pdf.destroy();
    throw new Error(
      `Output already exists: ${outputDirectory}. Use --replace only to replace this exact publication.`,
    );
  }

  const stagingDirectory = join(
    dirname(outputDirectory),
    `.${MANHWA_PUBLICATION_ID}.import-${process.pid}-${Date.now()}`,
  );

  await mkdir(stagingDirectory, { recursive: false });

  try {
    const files = [];
    for (let pageNumber = 1; pageNumber <= MANHWA_PAGE_COUNT; pageNumber += 1) {
      files.push(await renderPage(pdf.document, pageNumber, stagingDirectory));
    }

    await pdf.destroy();

    const manifest = {
      schemaVersion: 1,
      publicationId: MANHWA_PUBLICATION_ID,
      source: {
        fileName: MANHWA_SOURCE_FILE_NAME,
        sha256: sourceSha256,
        bytes: sourceBytes.byteLength,
        pageCount: MANHWA_PAGE_COUNT,
      },
      output: {
        format: 'webp',
        colorSpace: 'srgb',
        opaque: true,
        canvas: {
          width: MANHWA_CANVAS_WIDTH,
          height: MANHWA_CANVAS_HEIGHT,
          fit: 'contain',
          background: MANHWA_BACKGROUND,
        },
        encoder: {
          name: '@napi-rs/canvas',
          webpQuality: 90,
          pdfRenderer: 'pdfjs-dist',
          pdfJsVersion: pdf.pdfJsVersion,
        },
        files,
      },
    };

    await writeFile(
      join(stagingDirectory, OUTPUT_FILE_NAME),
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );

    if (outputAlreadyExists) {
      await rm(outputDirectory, { recursive: true, force: false });
    }

    await rename(stagingDirectory, outputDirectory);

    console.log(JSON.stringify({
      ok: true,
      publicationId: MANHWA_PUBLICATION_ID,
      source: {
        sha256: sourceSha256,
        pages: MANHWA_PAGE_COUNT,
      },
      outputDirectory,
      files: manifest.output.files.length,
    }, null, 2));
  } catch (error) {
    await pdf.destroy().catch(() => undefined);
    await rm(stagingDirectory, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  }
}

importPublication().catch((error) => {
  console.error(`Manhwa import failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
