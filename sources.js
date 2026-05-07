/**
 * sources.js  —  Reference implementation & documentation.
 *
 * ALL file references live in mode1.html's data-file attributes.
 * mode2.html and word_family.html each contain an inline copy of the
 * source-fetching logic (getM2Sources / getWFSourcePaths) so they have
 * no extra script dependency.  This file documents the shared pattern
 * and can be imported by future pages that need the same data.
 *
 * To add or move a file: edit the data-file attributes in mode1.html only.
 * All other pages will automatically pick up the change.
 *
 * Returned entries look like:
 *   { file: "../database/iLearn/Curriculum/U1 - 1.csv",   label: "Unit 1 · Lesson 1",   tab: "iLearn",   group: "── Unit 1 ──" }
 *
 * resolvePath(entry, fromDir) converts a data-file path (relative to
 * "wf mode/") to a path relative to a different directory:
 *   'wf mode'   → entry.file unchanged  (e.g. mode2.html)
 *   'root'      → strips the leading "../"  (e.g. word_family.html)
 */

const MODE1_PATH_FROM_DB   = '../wf mode/mode1.html';   // relative to database/
const MODE1_PATH_FROM_ROOT = 'wf mode/mode1.html';      // relative to project root
const MODE1_PATH_FROM_WF   = 'mode1.html';              // relative to wf mode/

let _cache = null;

/**
 * Fetch and parse mode1.html's lesson tab panels.
 * Returns an array of source entries.
 * Results are cached after the first call.
 */
async function getSources() {
  if (_cache) return _cache;

  // Try several relative paths so this module works from any page.
  const candidates = [
    MODE1_PATH_FROM_WF,
    MODE1_PATH_FROM_ROOT,
    MODE1_PATH_FROM_DB,
  ];

  let html = null;
  for (const path of candidates) {
    try {
      const res = await fetch(path);
      if (res.ok) { html = await res.text(); break; }
    } catch (_) {}
  }

  if (!html) {
    console.error('[sources.js] Could not load mode1.html from any candidate path.');
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const entries = [];
  doc.querySelectorAll('.lesson-tab-panel').forEach(panel => {
    const tab = panel.getAttribute('data-tab') || '';
    panel.querySelectorAll('optgroup').forEach(og => {
      const group = og.getAttribute('label') || '';
      og.querySelectorAll('option[data-file]').forEach(opt => {
        entries.push({
          file:  opt.getAttribute('data-file'),   // as written in mode1 (../database/…)
          label: opt.textContent.trim(),
          tab,
          group,
        });
      });
    });
  });

  _cache = entries;
  return entries;
}

/**
 * Convert a data-file path (always relative to "wf mode/") to a path
 * usable from a different directory.
 *
 * @param {string} dataFile   - e.g. "../database/iLearn/Curriculum/U1 - 1.csv"
 * @param {'wf'|'root'} from  - 'wf'   = caller is inside "wf mode/"
 *                              'root' = caller is at project root
 */
function resolvePath(dataFile, from = 'wf') {
  if (from === 'wf')   return dataFile;                        // already correct
  if (from === 'root') return dataFile.replace(/^\.\.\//, ''); // strip leading ../
  return dataFile;
}

/**
 * Convenience: return all unique file paths, resolved for the given caller.
 */
async function getAllPaths(from = 'wf') {
  const sources = await getSources();
  return [...new Set(sources.map(e => resolvePath(e.file, from)))];
}
