import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cssUrl = new URL(
  "../app/pureubon-preview/preview.module.css",
  import.meta.url,
);

test("uses the approved nature-seomgim palette and responsive grids", async () => {
  const css = await readFile(cssUrl, "utf8");

  assert.match(css, /--nature-cream:\s*#f2e7dd/i);
  assert.match(css, /--nature-beige:\s*#ebe0d4/i);
  assert.match(css, /--nature-green:\s*#234837/i);
  assert.match(css, /--nature-brown:\s*#ab8f70/i);
  assert.match(css, /@media\s*\(max-width:\s*960px\)/i);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/i);
  assert.match(
    css,
    /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/i,
  );
  assert.match(
    css,
    /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/i,
  );
  assert.match(
    css,
    /\.heroAccountPanel\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s*300px/i,
  );
  assert.match(
    css,
    /\.memberShortcuts\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/i,
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*960px\)[\s\S]*?\.heroAccountPanel\s*\{[\s\S]*?grid-template-columns:\s*1fr/i,
  );
  assert.match(
    css,
    /\.heroArea img\s*\{[^}]*object-position:\s*left center/i,
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*640px\)[\s\S]*?\.heroArea img\s*\{[^}]*object-position:\s*center/i,
  );
});
