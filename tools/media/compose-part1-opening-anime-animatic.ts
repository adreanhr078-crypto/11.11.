import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  renameSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { readConfiguredPath } from "../environment-setup/tool-resolution";

type CliArguments = {
  force: boolean;
  output?: string;
  poster?: string;
  referenceDir?: string;
};

type Probe = {
  streams?: Array<{
    codec_type?: string;
    codec_name?: string;
    width?: number;
    height?: number;
    pix_fmt?: string;
    r_frame_rate?: string;
    avg_frame_rate?: string;
  }>;
  format?: {
    duration?: string;
    size?: string;
    format_name?: string;
  };
};

type Shot = {
  file: string;
  durationSeconds: number;
  endZoom: number;
  panX: number;
  panY: number;
};

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const FPS = 24;
const WIDTH = 1920;
const HEIGHT = 1080;
const DURATION_SECONDS = 40;
const VIDEO_BUDGET_BYTES = 10 * 1024 * 1024;
const POSTER_BUDGET_BYTES = 2_726_298;
const POSTER_TIME_SECONDS = 35;
const CRF_CANDIDATES = [30, 32, 34, 36] as const;

const DEFAULT_REFERENCE_DIR = join(
  REPO_ROOT,
  "artifacts",
  "eleven-eleven",
  "art",
  "blender",
  "reference",
  "part-1-opening-anime",
);
const DEFAULT_OUTPUT = join(
  REPO_ROOT,
  "artifacts",
  "eleven-eleven",
  "public",
  "assets",
  "cinematics",
  "promotional",
  "echo-network-part1-opening-anime-animatic-v1.webm",
);
const DEFAULT_POSTER = join(
  REPO_ROOT,
  "artifacts",
  "eleven-eleven",
  "public",
  "assets",
  "cinematics",
  "promotional",
  "echo-network-part1-opening-anime-animatic-v1-poster.webp",
);

const SHOTS: readonly Shot[] = [
  {
    file: "shot-00-warm-school-breath-v1.webp",
    durationSeconds: 6,
    endZoom: 1.035,
    panX: -0.06,
    panY: -0.02,
  },
  {
    file: "shot-01-watch-threshold-v1.webp",
    durationSeconds: 3,
    endZoom: 1.07,
    panX: 0.04,
    panY: 0.02,
  },
  {
    file: "shot-02-containment-observer-v1.webp",
    durationSeconds: 9,
    endZoom: 1.06,
    panX: 0.04,
    panY: -0.02,
  },
  {
    file: "shot-03-neural-droplet-insert-v1.webp",
    durationSeconds: 4,
    endZoom: 1.08,
    panX: -0.04,
    panY: 0.03,
  },
  {
    file: "shot-04-witness-through-glass-v1.webp",
    durationSeconds: 3,
    endZoom: 1.04,
    panX: 0.04,
    panY: -0.02,
  },
  {
    file: "shot-05-reflection-fracture-v1.webp",
    durationSeconds: 7,
    endZoom: 1.07,
    panX: -0.04,
    panY: 0.02,
  },
  {
    file: "shot-06-signal-closeup-v1.webp",
    durationSeconds: 8,
    endZoom: 1.1,
    panX: 0.02,
    panY: -0.04,
  },
] as const;

function parseArgs(): CliArguments {
  const raw = process.argv.slice(2).filter((argument) => argument !== "--");
  const parsed: CliArguments = { force: false };

  for (let index = 0; index < raw.length; index += 1) {
    const argument = raw[index];
    if (argument === "--force") {
      parsed.force = true;
      continue;
    }

    if (
      argument === "--reference-dir" ||
      argument === "--output" ||
      argument === "--poster"
    ) {
      const value = raw[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${argument} requires a path.`);
      }
      if (argument === "--reference-dir") parsed.referenceDir = value;
      if (argument === "--output") parsed.output = value;
      if (argument === "--poster") parsed.poster = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return parsed;
}

function executable(envKey: string, fallback: string): string {
  return readConfiguredPath(envKey) ?? fallback;
}

function run(
  command: string,
  args: string[],
  timeoutMilliseconds = 30 * 60_000,
): string {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: timeoutMilliseconds,
    windowsHide: true,
  });

  if (result.error) {
    throw new Error(`${command} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} failed (${result.status ?? "unknown"}):\n${result.stderr || result.stdout}`,
    );
  }
  return result.stdout;
}

function removeIfPresent(path: string): void {
  if (existsSync(path)) unlinkSync(path);
}

function temporaryPath(finalPath: string, label: string): string {
  const extension = extname(finalPath);
  return `${finalPath.slice(0, -extension.length)}.${label}-${process.pid}-${Date.now()}${extension}`;
}

function publish(temporary: string, destination: string, force: boolean): void {
  if (existsSync(destination)) {
    if (!force) {
      throw new Error(
        `Output already exists; pass --force to replace it: ${destination}`,
      );
    }
    unlinkSync(destination);
  }
  renameSync(temporary, destination);
}

function probeMedia(ffprobe: string, path: string): Probe {
  return JSON.parse(
    run(
      ffprobe,
      [
        "-v",
        "error",
        "-show_entries",
        "stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate:format=duration,size,format_name",
        "-of",
        "json",
        path,
      ],
      30_000,
    ),
  ) as Probe;
}

function rationalToNumber(value: string | undefined): number {
  if (!value) return 0;
  const [numerator, denominator = "1"] = value.split("/");
  const denominatorNumber = Number(denominator);
  return denominatorNumber === 0 ? 0 : Number(numerator) / denominatorNumber;
}

function validateVideo(path: string, probe: Probe): void {
  const videoStreams =
    probe.streams?.filter((stream) => stream.codec_type === "video") ?? [];
  const audioStreams =
    probe.streams?.filter((stream) => stream.codec_type === "audio") ?? [];
  const video = videoStreams[0];
  const duration = Number(probe.format?.duration ?? 0);
  const frameRate = rationalToNumber(
    video?.avg_frame_rate ?? video?.r_frame_rate,
  );
  const bytes = statSync(path).size;

  if (videoStreams.length !== 1) {
    throw new Error(`Expected one video stream, found ${videoStreams.length}.`);
  }
  if (audioStreams.length !== 0) {
    throw new Error(
      `Expected a silent animatic, found ${audioStreams.length} audio stream(s).`,
    );
  }
  if (video?.codec_name !== "vp9") {
    throw new Error(`Expected VP9, found ${video?.codec_name ?? "unknown"}.`);
  }
  if (video.width !== WIDTH || video.height !== HEIGHT) {
    throw new Error(
      `Expected ${WIDTH}x${HEIGHT}, found ${video.width}x${video.height}.`,
    );
  }
  if (Math.abs(frameRate - FPS) > 0.001) {
    throw new Error(`Expected ${FPS} fps, found ${frameRate || "unknown"}.`);
  }
  if (Math.abs(duration - DURATION_SECONDS) > 0.06) {
    throw new Error(
      `Expected ${DURATION_SECONDS}s, found ${duration || "unknown"}s.`,
    );
  }
  if (bytes > VIDEO_BUDGET_BYTES) {
    throw new Error(
      `Video is ${bytes} bytes; budget is ${VIDEO_BUDGET_BYTES} bytes.`,
    );
  }
}

function validatePoster(path: string, probe: Probe): void {
  const video = probe.streams?.find((stream) => stream.codec_type === "video");
  const bytes = statSync(path).size;
  if (!video) throw new Error("Poster has no decodable image stream.");
  if (video.codec_name !== "webp") {
    throw new Error(
      `Expected a WebP poster, found ${video.codec_name ?? "unknown"}.`,
    );
  }
  if (video.width !== WIDTH || video.height !== HEIGHT) {
    throw new Error(
      `Expected a ${WIDTH}x${HEIGHT} poster, found ${video.width}x${video.height}.`,
    );
  }
  if (bytes > POSTER_BUDGET_BYTES) {
    throw new Error(
      `Poster is ${bytes} bytes; budget is ${POSTER_BUDGET_BYTES} bytes.`,
    );
  }
}

function shotFilter(shot: Shot, index: number): string {
  const frameCount = shot.durationSeconds * FPS;
  const lastFrame = frameCount - 1;
  const zoomDelta = shot.endZoom - 1;
  const fade =
    index === 0
      ? ",fade=t=in:st=0:d=1:color=black"
      : index === SHOTS.length - 1
        ? ",fade=t=out:st=6.92:d=1.08:color=black"
        : "";

  const zoomPan = [
    `zoompan=z='1+${zoomDelta}*on/${lastFrame}'`,
    `x='(iw-iw/zoom)*(0.5+${shot.panX}*on/${lastFrame})'`,
    `y='(ih-ih/zoom)*(0.5+${shot.panY}*on/${lastFrame})'`,
    `d=1:s=${WIDTH}x${HEIGHT}:fps=${FPS}`,
  ].join(":");

  return [
    `[${index}:v]scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
    zoomPan,
    `trim=end_frame=${frameCount}`,
    `setpts=N/(${FPS}*TB)`,
    "setsar=1",
    `format=yuv420p${fade}[v${index}]`,
  ].join(",");
}

function buildFilterGraph(): string {
  const shotFilters = SHOTS.map(shotFilter);
  const inputs = SHOTS.map((_, index) => `[v${index}]`).join("");
  return `${shotFilters.join(";")};${inputs}concat=n=${SHOTS.length}:v=1:a=0,format=yuv420p[vout]`;
}

function buildInputArguments(referenceDir: string): string[] {
  return SHOTS.flatMap((shot) => {
    const input = join(referenceDir, shot.file);
    if (!existsSync(input)) throw new Error(`Missing source plate: ${input}`);
    return [
      "-loop",
      "1",
      "-framerate",
      String(FPS),
      "-t",
      String(shot.durationSeconds),
      "-i",
      input,
    ];
  });
}

function encodeVideo(
  ffmpeg: string,
  referenceDir: string,
  output: string,
  crf: number,
): void {
  run(ffmpeg, [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-y",
    ...buildInputArguments(referenceDir),
    "-filter_complex",
    buildFilterGraph(),
    "-map",
    "[vout]",
    "-an",
    "-c:v",
    "libvpx-vp9",
    "-crf",
    String(crf),
    "-b:v",
    "0",
    "-deadline",
    "good",
    "-cpu-used",
    "3",
    "-row-mt",
    "1",
    "-tile-columns",
    "2",
    "-frame-parallel",
    "1",
    "-g",
    "240",
    "-force_key_frames",
    "0,6,9,18,22,25,32",
    "-pix_fmt",
    "yuv420p",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-colorspace",
    "bt709",
    "-metadata",
    "title=11.11 Echo Network Part 1 Opening Anime Animatic v1",
    "-metadata",
    "comment=Silent review animatic; live UI and audio are intentionally excluded.",
    "-f",
    "webm",
    output,
  ]);
}

function extractPoster(ffmpeg: string, input: string, output: string): void {
  run(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "warning",
      "-y",
      "-ss",
      String(POSTER_TIME_SECONDS),
      "-i",
      input,
      "-frames:v",
      "1",
      "-vf",
      `scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
      "-c:v",
      "libwebp",
      "-quality",
      "88",
      "-compression_level",
      "6",
      output,
    ],
    60_000,
  );
}

export function composePart1OpeningAnimeAnimatic(): void {
  const args = parseArgs();
  const referenceDir = resolve(args.referenceDir ?? DEFAULT_REFERENCE_DIR);
  const output = resolve(args.output ?? DEFAULT_OUTPUT);
  const poster = resolve(args.poster ?? DEFAULT_POSTER);
  if (extname(output).toLowerCase() !== ".webm") {
    throw new Error("--output must end in .webm.");
  }
  if (extname(poster).toLowerCase() !== ".webp") {
    throw new Error("--poster must end in .webp.");
  }
  if (!args.force && (existsSync(output) || existsSync(poster))) {
    throw new Error(
      "Output or poster already exists; pass --force to replace both.",
    );
  }

  const expectedDuration = SHOTS.reduce(
    (total, shot) => total + shot.durationSeconds,
    0,
  );
  if (expectedDuration !== DURATION_SECONDS) {
    throw new Error(
      `Shot timing totals ${expectedDuration}s, expected ${DURATION_SECONDS}s.`,
    );
  }

  mkdirSync(dirname(output), { recursive: true });
  mkdirSync(dirname(poster), { recursive: true });
  const temporaryVideo = temporaryPath(output, "partial");
  const temporaryPoster = temporaryPath(poster, "partial");
  const ffmpeg = executable(
    "FFMPEG_EXE",
    process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg",
  );
  const ffprobe = executable(
    "FFPROBE_EXE",
    process.platform === "win32" ? "ffprobe.exe" : "ffprobe",
  );

  let selectedCrf: number | undefined;
  try {
    for (const crf of CRF_CANDIDATES) {
      removeIfPresent(temporaryVideo);
      console.log(`Encoding 40-second animatic at VP9 CRF ${crf}...`);
      encodeVideo(ffmpeg, referenceDir, temporaryVideo, crf);
      if (statSync(temporaryVideo).size <= VIDEO_BUDGET_BYTES) {
        selectedCrf = crf;
        break;
      }
      console.warn(
        `CRF ${crf} produced ${statSync(temporaryVideo).size} bytes; retrying within the 10 MB budget.`,
      );
    }

    if (selectedCrf === undefined) {
      throw new Error(
        "All configured VP9 quality passes exceeded the 10 MB budget.",
      );
    }

    const videoProbe = probeMedia(ffprobe, temporaryVideo);
    validateVideo(temporaryVideo, videoProbe);

    extractPoster(ffmpeg, temporaryVideo, temporaryPoster);
    const posterProbe = probeMedia(ffprobe, temporaryPoster);
    validatePoster(temporaryPoster, posterProbe);

    publish(temporaryVideo, output, args.force);
    publish(temporaryPoster, poster, args.force);

    console.log(
      JSON.stringify(
        {
          status: "PASS",
          referenceDir,
          output,
          poster,
          selectedCrf,
          shots: SHOTS.map(({ file, durationSeconds, endZoom }) => ({
            file,
            durationSeconds,
            endZoom,
          })),
          video: {
            bytes: statSync(output).size,
            probe: videoProbe,
          },
          posterAsset: {
            bytes: statSync(poster).size,
            sampledAtSeconds: POSTER_TIME_SECONDS,
            probe: posterProbe,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    removeIfPresent(temporaryVideo);
    removeIfPresent(temporaryPoster);
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  try {
    composePart1OpeningAnimeAnimatic();
  } catch (error) {
    console.error(
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
    process.exitCode = 1;
  }
}
