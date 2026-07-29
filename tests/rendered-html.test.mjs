import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Pureubon homepage preview", async () => {
  const response = await render("/pureubon-preview");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /자연섬김 푸르본 \| 산지직송 농산물/);
  assert.match(html, /지금 많이 찾는 상품/);
  assert.match(html, /산지에서 바로, 이번 주 특별가/);
  assert.match(html, /자연섬김 이야기/);
  assert.match(html, /배송 · 교환 · 반품 안내/);
});

test("keeps the Cafe24 replacement slots in the preview source", async () => {
  const [page, header] = await Promise.all([
    readFile(
      new URL("../app/pureubon-preview/page.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../app/pureubon-preview/_components/SiteHeader.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  for (const slot of [
    "hero",
    "quick-links",
    "featured-products",
    "season-deals",
    "farm-groups",
    "exhibitions",
    "brand-story",
    "trust-guide",
    "footer",
  ]) {
    assert.match(page, new RegExp(`data-cafe24-slot=["']${slot}["']`));
  }

  assert.match(header, /data-cafe24-slot=["']header["']/);
  assert.match(header, /data-cafe24-slot=["']category["']/);
});
