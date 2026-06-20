import { motion } from "framer-motion";
import { useMemo, useState, type ChangeEvent } from "react";

type CompressPresetKey = "ultra" | "balanced" | "small";

type CompressPreset = {
  label: string;
  reduction: number;
  note: string;
};

type FilePreview = {
  original: string;
  output: string;
  detected: string[];
  compression: string;
  watermark: string;
  cover: string;
};

const sampleBatch = `SUGAR MOMMY 2026 1080p Tagalog WEB-DL HEVC x265 BO -@MNTGX.-.mkv
Neon.City.S01E04.1080p.WEB-DL.H265.Atmos.mkv
The.Lost.Reel.2024.720p.BluRay.x264.AAC.mp4`;

const presets: Record<CompressPresetKey, CompressPreset> = {
  ultra: {
    label: "Ultra quality",
    reduction: 12,
    note: "Keeps the cleanest picture with the lightest compression pass.",
  },
  balanced: {
    label: "Balanced",
    reduction: 34,
    note: "Best for daily sharing, device storage, and fast exports.",
  },
  small: {
    label: "Smallest file",
    reduction: 56,
    note: "Aggressive compression for maximum storage savings.",
  },
};

const featureRows = [
  {
    title: "Bulk metadata editing",
    description:
      "Apply title, year, language, codec, and custom tags to a whole folder in one pass.",
  },
  {
    title: "Cover image support",
    description:
      "Embed poster art, replace thumbnails, or sync a folder cover without touching each file manually.",
  },
  {
    title: "Watermark engine",
    description:
      "Stamp every video with a branded watermark position, size, opacity, and batch preset.",
  },
  {
    title: "Movie compress support",
    description:
      "Pick a compression profile for mobile delivery, archival copies, or lighter uploads.",
  },
  {
    title: "Offline first",
    description:
      "Everything is built to run on-device, so the app stays fast without a powerful server.",
  },
  {
    title: "Release-safe file rules",
    description:
      "Rename patterns, normalize spacing, and preserve extensions while keeping your queue organized.",
  },
];

const quickSteps = [
  "Drop in a batch of videos or text-paste a queue.",
  "Choose metadata, cover, watermark, and compression rules.",
  "Export the full batch with one consistent naming standard.",
];

function splitExtension(filename: string) {
  const trimmed = filename.trim();
  const dotIndex = trimmed.lastIndexOf(".");

  if (dotIndex > 0) {
    return {
      base: trimmed.slice(0, dotIndex),
      ext: trimmed.slice(dotIndex),
    };
  }

  return { base: trimmed, ext: "" };
}

function parseDetectedTags(source: string) {
  const tags = ["WEB-DL", "WEBRip", "BluRay", "HEVC", "H.265", "x265", "x264", "1080p", "720p", "4K", "Tagalog", "Atmos"].filter(
    (tag) => new RegExp(tag.replace(/\./g, "\\."), "i").test(source)
  );

  return tags;
}

function normalizeName(value: string) {
  return value
    .replace(/\s*[-_]{2,}\s*/g, " - ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([._-])/g, "$1")
    .replace(/([._-])\s+/g, "$1")
    .replace(/\s*-\s*$/, "")
    .trim();
}

function transformFile(
  filename: string,
  settings: {
    replaceFrom: string;
    replaceTo: string;
    stripReleaseTag: boolean;
    normalizeSpacing: boolean;
    watermark: string;
    coverUrl: string;
    compressPreset: CompressPresetKey;
  }
): FilePreview | null {
  const trimmed = filename.trim();

  if (!trimmed) {
    return null;
  }

  const { base, ext } = splitExtension(trimmed);
  let nextBase = base;

  if (settings.stripReleaseTag) {
    nextBase = nextBase.replace(/\s*-\s*@[^.]+(?:\.-)?$/i, "");
  }

  if (settings.replaceFrom) {
    nextBase = nextBase.split(settings.replaceFrom).join(settings.replaceTo);
  }

  if (settings.normalizeSpacing) {
    nextBase = normalizeName(nextBase);
  }

  const detected = parseDetectedTags(trimmed);
  const preset = presets[settings.compressPreset];
  const output = `${nextBase}${ext}`;

  return {
    original: trimmed,
    output,
    detected,
    compression: `${preset.label} - ${preset.reduction}% lighter`,
    watermark: settings.watermark ? `${settings.watermark} ${settings.watermark ? "on" : ""}`.trim() : "Off",
    cover: settings.coverUrl ? "Custom cover embedded" : "Folder cover ready",
  };
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.45em] text-sky-300/80">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-300">{description}</p>
    </div>
  );
}

function App() {
  const [filesText, setFilesText] = useState(sampleBatch);
  const [replaceFrom, setReplaceFrom] = useState("1080p");
  const [replaceTo, setReplaceTo] = useState("2160p");
  const [watermark, setWatermark] = useState("MN VIDEO");
  const [coverUrl, setCoverUrl] = useState("cover-art.jpg");
  const [compressPreset, setCompressPreset] = useState<CompressPresetKey>("balanced");
  const [stripReleaseTag, setStripReleaseTag] = useState(true);
  const [normalizeSpacing, setNormalizeSpacing] = useState(true);
  const [copyLabel, setCopyLabel] = useState("Copy output batch");

  const previews = useMemo(() => {
    return filesText
      .split(/\r?\n/)
      .map((line) =>
        transformFile(line, {
          replaceFrom,
          replaceTo,
          stripReleaseTag,
          normalizeSpacing,
          watermark,
          coverUrl,
          compressPreset,
        })
      )
      .filter((entry): entry is FilePreview => Boolean(entry));
  }, [filesText, replaceFrom, replaceTo, stripReleaseTag, normalizeSpacing, watermark, coverUrl, compressPreset]);

  const activePreset = presets[compressPreset];
  const estimatedReduction = `${activePreset.reduction}%`;

  const handleCopy = async () => {
    if (!previews.length || typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyLabel("Nothing to copy");
      window.setTimeout(() => setCopyLabel("Copy output batch"), 1600);
      return;
    }

    await navigator.clipboard.writeText(previews.map((item) => item.output).join("\n"));
    setCopyLabel("Copied queue");
    window.setTimeout(() => setCopyLabel("Copy output batch"), 1800);
  };

  const loadSample = () => {
    setFilesText(sampleBatch);
    setReplaceFrom("1080p");
    setReplaceTo("2160p");
    setWatermark("MN VIDEO");
    setCoverUrl("cover-art.jpg");
    setCompressPreset("balanced");
    setStripReleaseTag(true);
    setNormalizeSpacing(true);
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white antialiased selection:bg-sky-400/30 selection:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_28%),radial-gradient(circle_at_bottom,rgba(15,118,110,0.14),transparent_25%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.18]" />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-sky-300/70">Android bulk studio</p>
            <h1 className="mt-2 text-lg font-semibold tracking-tight text-white">Mn Video Editor</h1>
          </div>

          <div className="hidden items-center gap-3 text-sm text-slate-300 md:flex">
            <a href="#studio" className="transition hover:text-white">
              Studio
            </a>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#credits" className="transition hover:text-white">
              Credits
            </a>
          </div>

          <a
            href="/release/Mn-Video-Editor-latest.apk"
            download
            className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-300/60 hover:bg-sky-400/20"
          >
            Download latest APK
          </a>
        </header>

        <section className="relative pt-14 sm:pt-18">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-sky-300/80">Powerful. Offline. Batch ready.</p>
              <h2 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Mn Video Editor
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Bulk edit media metadata, swap cover art, add watermarks, and compress movie files on-device.
                No powerful server required, just a fast Android workflow that feels professional.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="/release/Mn-Video-Editor-latest.apk"
                  download
                  className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Download latest APK
                </a>
                <a
                  href="https://t.me/mnbots"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
                >
                  Update channel
                </a>
                <a
                  href="#studio"
                  className="inline-flex items-center rounded-full border border-transparent px-2 py-3 text-sm font-semibold text-sky-200 transition hover:text-white"
                >
                  Open batch studio
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="relative overflow-hidden border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />

              <div className="relative grid min-h-[420px] gap-0 lg:grid-cols-[1.1fr_0.08fr_0.82fr]">
                <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-sky-300/70">Input queue</p>
                  <div className="mt-5 space-y-4 text-sm text-slate-200">
                    <div>
                      <p className="text-slate-400">Folder scan</p>
                      <p className="mt-1 font-medium text-white">12 files detected</p>
                    </div>
                    <div>
                      <p className="text-slate-400">File rule</p>
                      <p className="mt-1 font-medium text-white">1080p to 2160p rename</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Watermark</p>
                      <p className="mt-1 font-medium text-white">MN VIDEO, top-right</p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3 text-xs leading-6 text-slate-400">
                    <p className="rounded-full border border-white/10 px-3 py-2">SUGAR MOMMY 2026 1080p Tagalog WEB-DL HEVC x265 BO -@MNTGX.-.mkv</p>
                    <p className="rounded-full border border-white/10 px-3 py-2">Neon.City.S01E04.1080p.WEB-DL.H265.Atmos.mkv</p>
                    <p className="rounded-full border border-white/10 px-3 py-2">The.Lost.Reel.2024.720p.BluRay.x264.AAC.mp4</p>
                  </div>
                </div>

                <div className="hidden items-center justify-center border-white/10 lg:flex lg:border-r">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/10 text-sky-200"
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M5 12h14" />
                      <path d="m13 5 7 7-7 7" />
                    </svg>
                  </motion.div>
                </div>

                <div className="p-6">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-violet-300/70">Output preview</p>
                  <div className="mt-5 space-y-5">
                    <div>
                      <p className="text-sm text-slate-400">Renamed file</p>
                      <p className="mt-2 break-words text-xl font-semibold leading-8 text-white">
                        SUGAR MOMMY 2026 2160p Tagalog WEB-DL HEVC x265 BO.mkv
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                      <div className="border border-white/10 bg-white/5 p-4">
                        <p className="text-slate-400">Cover</p>
                        <p className="mt-1 font-medium text-white">Embedded poster art</p>
                      </div>
                      <div className="border border-white/10 bg-white/5 p-4">
                        <p className="text-slate-400">Compression</p>
                        <p className="mt-1 font-medium text-white">Balanced profile</p>
                      </div>
                    </div>

                    <div className="border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      <p className="text-slate-400">On-device workflow</p>
                      <p className="mt-2 leading-6 text-slate-200">
                        Metadata, cover art, watermark, and compression logic are designed to run locally so users can
                        process large batches without a server bottleneck.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="studio" className="mt-20 grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionHeading
              eyebrow="Bulk studio"
              title="Edit once, apply everywhere."
              description="Paste a queue of filenames, set your rules, then let the app generate a clean batch preview before export."
            />

            <div className="mt-8 space-y-6 border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div>
                <label className="text-sm font-medium text-white" htmlFor="batch-input">
                  Batch queue
                </label>
                <textarea
                  id="batch-input"
                  value={filesText}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setFilesText(event.target.value)}
                  rows={7}
                  className="mt-3 w-full resize-none border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400/50"
                  placeholder="Paste one video filename per line"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-white">
                  <span>Replace from</span>
                  <input
                    value={replaceFrom}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setReplaceFrom(event.target.value)}
                    className="w-full border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400/50"
                    placeholder="1080p"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-white">
                  <span>Replace to</span>
                  <input
                    value={replaceTo}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setReplaceTo(event.target.value)}
                    className="w-full border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400/50"
                    placeholder="2160p"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-white">
                  <span>Watermark text</span>
                  <input
                    value={watermark}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setWatermark(event.target.value)}
                    className="w-full border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400/50"
                    placeholder="MN VIDEO"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-white">
                  <span>Cover image source</span>
                  <input
                    value={coverUrl}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setCoverUrl(event.target.value)}
                    className="w-full border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400/50"
                    placeholder="cover-art.jpg"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-white">
                  <span>Compression preset</span>
                  <select
                    value={compressPreset}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => setCompressPreset(event.target.value as CompressPresetKey)}
                    className="w-full border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none transition focus:border-sky-400/50"
                  >
                    <option value="ultra">Ultra quality</option>
                    <option value="balanced">Balanced</option>
                    <option value="small">Smallest file</option>
                  </select>
                </label>

                <div className="space-y-2 text-sm font-medium text-white">
                  <span>Batch options</span>
                  <div className="grid gap-2 text-sm text-slate-200">
                    <label className="flex items-center gap-3 border border-white/10 bg-slate-950/70 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={stripReleaseTag}
                        onChange={(event) => setStripReleaseTag(event.target.checked)}
                        className="h-4 w-4 accent-sky-400"
                      />
                      Remove release tag suffixes
                    </label>
                    <label className="flex items-center gap-3 border border-white/10 bg-slate-950/70 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={normalizeSpacing}
                        onChange={(event) => setNormalizeSpacing(event.target.checked)}
                        className="h-4 w-4 accent-sky-400"
                      />
                      Normalize spacing and separators
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={loadSample}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                >
                  Load sample batch
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                >
                  {copyLabel}
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, delay: 0.05, ease: "easeOut" }}
            className="space-y-6"
          >
            <SectionHeading
              eyebrow="Live preview"
              title="See the new names before export."
              description="The preview updates instantly, so you can confirm every rename, watermark, and compression decision in bulk."
            />

            <div className="space-y-4 border border-white/10 bg-slate-950/65 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 text-sm text-slate-300">
                <span>{previews.length} files in queue</span>
                <span>{estimatedReduction} estimated compression reduction</span>
              </div>

              <div className="space-y-3">
                {previews.map((item, index) => (
                  <motion.div
                    key={`${item.original}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: index * 0.05 }}
                    className="border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Original</p>
                        <p className="mt-2 break-words text-sm text-slate-200">{item.original}</p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">Output</p>
                        <p className="mt-2 break-words text-base font-semibold text-white">{item.output}</p>
                      </div>

                      <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                        <div>
                          <p className="text-slate-500">Detected</p>
                          <p className="mt-1 leading-6 text-slate-200">{item.detected.length ? item.detected.join(" · ") : "No tags detected"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Watermark</p>
                          <p className="mt-1 leading-6 text-slate-200">{item.watermark}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Cover</p>
                          <p className="mt-1 leading-6 text-slate-200">{item.cover}</p>
                        </div>
                      </div>

                      <div className="h-1 w-full overflow-hidden bg-white/10">
                        <motion.div
                          initial={{ width: "12%" }}
                          animate={{ width: `${100 - activePreset.reduction}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-violet-400"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
                <p className="font-medium text-white">Compression profile</p>
                <p className="mt-1 text-slate-200">{activePreset.note}</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="mt-24">
          <SectionHeading
            eyebrow="Suites and upgrades"
            title="More tools that fit this app."
            description="These features keep the app focused on pro batch work instead of competing with general-purpose editors."
          />

          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {featureRows.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="grid gap-3 py-5 md:grid-cols-[0.45fr_0.55fr] md:gap-8"
              >
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-7 text-slate-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {quickSteps.map((step, index) => (
              <div key={step} className="border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300/70">Step {index + 1}</p>
                <p className="mt-3">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="credits" className="mt-24 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-sky-300/80">Release board</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">Vercel APK distribution</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Host the site on Vercel, keep the app UI here, and point the APK download path to your latest build asset.
              The button above is ready for a static release file at <span className="text-white">/release/Mn-Video-Editor-latest.apk</span>.
            </p>

            <a
              href="/release/Mn-Video-Editor-latest.apk"
              download
              className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Download latest APK
            </a>
          </div>

          <div className="border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-violet-300/80">Credits and support</p>
            <div className="mt-4 grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
              <a
                href="https://github.com/mntgxo"
                target="_blank"
                rel="noreferrer"
                className="border border-white/10 bg-slate-950/60 p-4 transition hover:border-white/20 hover:bg-slate-900/80"
              >
                <p className="text-slate-500">Dev</p>
                <p className="mt-2 font-medium text-white">github.com/mntgxo</p>
              </a>
              <a
                href="https://t.me/mnbots"
                target="_blank"
                rel="noreferrer"
                className="border border-white/10 bg-slate-950/60 p-4 transition hover:border-white/20 hover:bg-slate-900/80"
              >
                <p className="text-slate-500">Update channel</p>
                <p className="mt-2 font-medium text-white">t.me/mnbots</p>
              </a>
              <a
                href="https://t.me/mnbots_support"
                target="_blank"
                rel="noreferrer"
                className="border border-white/10 bg-slate-950/60 p-4 transition hover:border-white/20 hover:bg-slate-900/80"
              >
                <p className="text-slate-500">Report bugs</p>
                <p className="mt-2 font-medium text-white">t.me/mnbots_support</p>
              </a>
            </div>
          </div>
        </section>

        <footer className="mt-16 border-t border-white/10 pt-6 text-sm text-slate-500">
          Mn Video Editor is designed as a pro batch media companion for Android, built to feel fast, local, and
          organized.
        </footer>
      </main>
    </div>
  );
}

export default App;