#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { access, readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = resolve(SCRIPT_DIRECTORY, '../..');
const PUBLICATION_ID = 'echo-network-final-2026-09-v1';
const SOURCE_FILE_NAME = '11.11_Echo_Network_Manhwa_FINAL_ORDERED_NO_DUPLICATES.pdf';
const SOURCE_SHA256 = '6BE33FDD8A66210302AA44ED56D854B544F7A8B4C62AA57108557438571BFF1C';
const PAGE_COUNT = 70;
const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 2700;
const MAX_FILE_BYTES = 2_726_298;
const DEFAULT_SOURCE_PATH = `C:\\Users\\yasmo\\Downloads\\${SOURCE_FILE_NAME}`;
const DEFAULT_PUBLICATION_DIRECTORY = resolve(
  PROJECT_DIRECTORY,
  'public/manhwa',
  PUBLICATION_ID,
);

function printUsage() {
  console.log(`
Usage:
  npm run manhwa:validate -- [--source "C:\\path\\to\\${SOURCE_FILE_NAME}"] [--publication <path>]

The source hash is verified when --source (or ELEVEN_ELEVEN_MANHWA_SOURCE) is available.
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

  const supported = new Set(['--source', '--publication']);
  for (const argument of argumentsList) {
    if (argument.startsWith('--') && !supported.has(argument)) {
      throw new Error(`Unknown option: ${argument}`);
    }
  }

  return {
    source: readOption(argumentsList, '--source') ?? process.env.ELEVEN_ELEVEN_MANHWA_SOURCE,
    publicationDirectory: resolve(
      readOption(argumentsList, '--publication') ?? DEFAULT_PUBLICATION_DIRECTORY,
    ),
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

function expectedFileName(pageNumber) {
  return `page-${String(pageNumber).padStart(3, '0')}.webp`;
}

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function validateSource(sourceOption, manifest) {
  const sourcePath = sourceOption ? resolve(sourceOption) : undefined;
  if (!sourcePath) {
    return { verified: false, reason: 'No source path supplied.' };
  }

  invariant(await pathExists(sourcePath), `Source PDF does not exist: ${sourcePath}`);
  const sourceStats = await stat(sourcePath);
  invariant(sourceStats.isFile(), `Source path is not a file: ${sourcePath}`);

  const sourceSha = sha256(await readFile(sourcePath));
  invariant(sourceSha === SOURCE_SHA256, `Source PDF SHA256 does not match the approved publication.`);
  invariant(sourceSha === manifest.source.sha256, `Source PDF SHA256 does not match publication-manifest.json.`);

  return { verified: true, path: sourcePath, sha256: sourceSha };
}

async function validatePublication() {
  const options = parseArguments(process.argv.slice(2));
  const manifestPath = join(options.publicationDirectory, 'publication-manifest.json');
  invariant(await pathExists(manifestPath), `Publication manifest does not exist: ${manifestPath}`);

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  invariant(manifest?.schemaVersion === 1, 'Unsupported publication manifest schema.');
  invariant(manifest?.publicationId === PUBLICATION_ID, `Expected publicationId ${PUBLICATION_ID}.`);
  invariant(manifest?.source?.fileName === SOURCE_FILE_NAME, 'Unexpected source file name in manifest.');
  invariant(manifest?.source?.sha256 === SOURCE_SHA256, 'Unexpected source SHA256 in manifest.');
  invariant(manifest?.source?.pageCount === PAGE_COUNT, `Expected ${PAGE_COUNT} source pages.`);
  invariant(manifest?.output?.format === 'webp', 'Output format must be WebP.');
  invariant(manifest?.output?.colorSpace === 'srgb', 'Output color space must be sRGB.');
  invariant(manifest?.output?.opaque === true, 'Output must be opaque.');
  invariant(manifest?.output?.canvas?.width === CANVAS_WIDTH, `Output width must be ${CANVAS_WIDTH}.`);
  invariant(manifest?.output?.canvas?.height === CANVAS_HEIGHT, `Output height must be ${CANVAS_HEIGHT}.`);
  invariant(manifest?.output?.canvas?.fit === 'contain', 'Output fit mode must be contain.');
  invariant(manifest?.output?.canvas?.background === '#03040a', 'Output background must be #03040a.');
  invariant(Array.isArray(manifest?.output?.files), 'Output files must be an array.');
  invariant(manifest.output.files.length === PAGE_COUNT, `Expected ${PAGE_COUNT} output file entries.`);

  const directoryEntries = await readdir(options.publicationDirectory, { withFileTypes: true });
  const webpFiles = directoryEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.webp'))
    .map((entry) => entry.name)
    .sort();
  const expectedNames = Array.from({ length: PAGE_COUNT }, (_, index) => expectedFileName(index + 1));
  invariant(
    JSON.stringify(webpFiles) === JSON.stringify(expectedNames),
    'Publication must contain exactly page-001.webp through page-070.webp and no extra WebP files.',
  );

  const outputHashes = new Set();
  const pixelHashes = new Set();
  let totalBytes = 0;

  for (const [index, entry] of manifest.output.files.entries()) {
    const pageNumber = index + 1;
    const expectedName = expectedFileName(pageNumber);
    invariant(entry?.pageNumber === pageNumber, `Manifest page ${pageNumber} has an invalid page number.`);
    invariant(entry?.file === expectedName, `Manifest page ${pageNumber} has an invalid file name.`);

    const outputPath = join(options.publicationDirectory, expectedName);
    const fileBytes = await readFile(outputPath);
    const fileHash = sha256(fileBytes);
    invariant(fileHash === entry.sha256, `Output hash mismatch for ${expectedName}.`);
    invariant(!outputHashes.has(fileHash), `Duplicate encoded page detected: ${expectedName}.`);
    outputHashes.add(fileHash);
    invariant(fileBytes.byteLength === entry.bytes, `Output byte count mismatch for ${expectedName}.`);
    invariant(fileBytes.byteLength <= MAX_FILE_BYTES, `${expectedName} exceeds the ${MAX_FILE_BYTES}-byte asset budget.`);
    totalBytes += fileBytes.byteLength;

    const image = sharp(fileBytes, { failOn: 'error' });
    const metadata = await image.metadata();
    invariant(metadata.format === 'webp', `${expectedName} is not a valid WebP image.`);
    invariant(metadata.width === CANVAS_WIDTH && metadata.height === CANVAS_HEIGHT, `${expectedName} has invalid dimensions.`);
    invariant(metadata.space === 'srgb', `${expectedName} is not tagged as sRGB.`);
    invariant(metadata.hasAlpha !== true, `${expectedName} is not opaque.`);

    const rawPixels = await sharp(fileBytes, { failOn: 'error' }).removeAlpha().raw().toBuffer();
    const pixelHash = sha256(rawPixels);
    invariant(!pixelHashes.has(pixelHash), `Duplicate rendered pixels detected: ${expectedName}.`);
    pixelHashes.add(pixelHash);
  }

  const source = await validateSource(options.source, manifest);
  console.log(JSON.stringify({
    ok: true,
    publicationId: PUBLICATION_ID,
    pages: PAGE_COUNT,
    totalBytes,
    source,
  }, null, 2));
}

validatePublication().catch((error) => {
  console.error(`Manhwa validation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
