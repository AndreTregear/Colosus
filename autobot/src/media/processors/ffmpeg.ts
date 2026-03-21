import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { FFMPEG_PATH, FFPROBE_PATH } from '../../config.js';
import type { MediaProbe, TranscodeOpts, HLSOpts } from '../types.js';

const exec = promisify(execFile);

/** Create a temporary file path for processing. */
export async function createTempPath(extension: string): Promise<string> {
  const dir = path.join(os.tmpdir(), 'autobot-media');
  await fs.mkdir(dir, { recursive: true });
  return path.join(dir, `${crypto.randomBytes(8).toString('hex')}${extension}`);
}

/** Create a temporary directory for HLS output. */
export async function createTempDir(): Promise<string> {
  const dir = path.join(os.tmpdir(), 'autobot-media', crypto.randomBytes(8).toString('hex'));
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/** Clean up temp file(s). */
export async function cleanupTemp(...paths: string[]): Promise<void> {
  for (const p of paths) {
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) {
        await fs.rm(p, { recursive: true, force: true });
      } else {
        await fs.unlink(p);
      }
    } catch {
      // already gone
    }
  }
}

/** Probe a media file for metadata. */
export async function probe(inputPath: string): Promise<MediaProbe> {
  const { stdout } = await exec(FFPROBE_PATH, [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    inputPath,
  ]);

  const data = JSON.parse(stdout);
  const videoStream = data.streams?.find((s: Record<string, unknown>) => s.codec_type === 'video');
  const audioStream = data.streams?.find((s: Record<string, unknown>) => s.codec_type === 'audio');
  const format = data.format ?? {};

  return {
    durationMs: Math.round((parseFloat(format.duration) || 0) * 1000),
    width: videoStream?.width ?? 0,
    height: videoStream?.height ?? 0,
    codec: videoStream?.codec_name ?? audioStream?.codec_name ?? 'unknown',
    bitrate: parseInt(format.bit_rate) || 0,
    sampleRate: audioStream ? parseInt(audioStream.sample_rate) : undefined,
    channels: audioStream?.channels,
  };
}

const RESOLUTION_MAP: Record<string, string> = {
  '360p': '640:360',
  '720p': '1280:720',
  '1080p': '1920:1080',
};

/** Transcode a media file. */
export async function transcode(
  input: string,
  output: string,
  opts: TranscodeOpts,
): Promise<void> {
  const args = ['-i', input, '-y'];

  if (opts.audioOnly) {
    args.push('-vn'); // no video
  }

  if (opts.audioBitrate) {
    args.push('-b:a', opts.audioBitrate);
  }

  if (opts.videoBitrate) {
    args.push('-b:v', opts.videoBitrate);
  }

  if (opts.resolution && RESOLUTION_MAP[opts.resolution]) {
    args.push('-vf', `scale=${RESOLUTION_MAP[opts.resolution]}:force_original_aspect_ratio=decrease,pad=${RESOLUTION_MAP[opts.resolution]}:(ow-iw)/2:(oh-ih)/2`);
  }

  // Output format
  if (opts.format === 'opus') {
    args.push('-c:a', 'libopus', '-f', 'ogg');
  } else if (opts.format === 'mp4') {
    args.push('-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac', '-movflags', '+faststart');
  } else if (opts.format === 'mp3') {
    args.push('-c:a', 'libmp3lame');
  }

  args.push(output);
  await exec(FFMPEG_PATH, args, { timeout: 300_000 }); // 5 minute timeout
}

/** Generate a thumbnail from a video file. */
export async function generateThumbnail(
  input: string,
  output: string,
  atSeconds: number = 1,
): Promise<void> {
  await exec(FFMPEG_PATH, [
    '-i', input,
    '-ss', String(atSeconds),
    '-vframes', '1',
    '-vf', 'scale=320:-1',
    '-y',
    output,
  ], { timeout: 30_000 });
}

/** Generate HLS segments for adaptive bitrate streaming. */
export async function generateHLS(
  input: string,
  outputDir: string,
  opts: HLSOpts = { segmentDuration: 6 },
): Promise<string[]> {
  const playlistPath = path.join(outputDir, 'playlist.m3u8');

  const args = [
    '-i', input,
    '-c:v', 'libx264', '-preset', 'fast',
    '-c:a', 'aac',
    '-hls_time', String(opts.segmentDuration),
    '-hls_list_size', '0',
    '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'),
    '-y',
  ];

  if (opts.resolution && RESOLUTION_MAP[opts.resolution]) {
    args.push('-vf', `scale=${RESOLUTION_MAP[opts.resolution]}:force_original_aspect_ratio=decrease`);
  }

  args.push(playlistPath);
  await exec(FFMPEG_PATH, args, { timeout: 600_000 }); // 10 minute timeout

  // List generated files
  const files = await fs.readdir(outputDir);
  return files;
}
