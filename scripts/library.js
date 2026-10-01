/**
 * Track library: discovers musslop exports under Data/musslop/<slug>/ and
 * imports *_foundry.zip files there (upload via FilePicker).
 */
import { MODULE_ID, ROOT_DIR, log } from "./const.js";

function FP() {
  // v13: foundry.applications.apps.FilePicker.implementation ; v12: global FilePicker
  return globalThis.foundry?.applications?.apps?.FilePicker?.implementation || globalThis.FilePicker;
}

async function ensureDir(path) {
  const fp = FP();
  try { await fp.createDirectory("data", path); }
  catch (e) { if (!/EEXIST|already exists/i.test(String(e))) throw e; }
}

/** List track folders that contain a manifest.json. */
export async function scanLibrary() {
  const fp = FP();
  const out = [];
  let root;
  try { root = await fp.browse("data", ROOT_DIR); }
  catch (e) { return out; } // folder does not exist yet
  for (const dir of root.dirs || []) {
    try {
      const d = await fp.browse("data", dir);
      const manifestPath = (d.files || []).find(f => f.endsWith("/manifest.json"));
      if (!manifestPath) continue;
      const manifest = await (await fetch(manifestPath, { cache: "no-store" })).json();
      if (manifest.format !== "musslop-loops") continue;
      out.push({ dir, slug: dir.split("/").pop(), name: manifest.track || dir.split("/").pop(), manifest });
    } catch (e) { log.warn("skip", dir, e); }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/** Fetch a file of a track as ArrayBuffer. */
export async function fetchTrackFile(track, file) {
  const r = await fetch(`${track.dir}/${file}`, { cache: "force-cache" });
  if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
  return r.arrayBuffer();
}

/**
 * Import a *_foundry.zip produced by musslop: unpack in the browser (JSZip
 * ships with Foundry) and upload each file to Data/musslop/<slug>/.
 * @param {File} zipFile
 * @param {(done:number,total:number,name:string)=>void} [onProgress]
 * @returns {{slug:string, dir:string, files:number, manifest:object}}
 */
export async function importZip(zipFile, onProgress) {
  const JSZip = globalThis.JSZip;
  if (!JSZip) throw new Error("JSZip is not available in this Foundry build");
  const zip = await JSZip.loadAsync(zipFile);
  const manifestEntry = zip.file("manifest.json");
  if (!manifestEntry) throw new Error("manifest.json not found — is this a musslop export?");
  const manifest = JSON.parse(await manifestEntry.async("string"));
  if (manifest.format !== "musslop-loops") throw new Error("Not a musslop-loops manifest");
  const slug = (manifest.slug || manifest.track || zipFile.name.replace(/_foundry\.zip$|\.zip$/i, ""))
    .replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "") || "track";
  const dir = `${ROOT_DIR}/${slug}`;
  await ensureDir(ROOT_DIR);
  await ensureDir(dir);
  const entries = Object.values(zip.files).filter(f => !f.dir);
  const fp = FP();
  let done = 0;
  for (const entry of entries) {
    const name = entry.name.split("/").pop();
    if (!name || name.startsWith(".")) continue;
    const blob = await entry.async("blob");
    const type = name.endsWith(".wav") ? "audio/wav" : name.endsWith(".json") ? "application/json" : "application/octet-stream";
    const file = new File([blob], name, { type });
    await fp.upload("data", dir, file, {}, { notify: false });
    done++;
    onProgress?.(done, entries.length, name);
  }
  return { slug, dir, files: done, manifest };
}
