import assert from "node:assert/strict";
import test from "node:test";

async function renderPreview() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("pureubon-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/pureubon-preview", {
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

test("renders the nature-seomgim preview shell", async () => {
  const response = await renderPreview();
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>자연섬김 푸르본 \| 산지직송 농산물<\/title>/);
  assert.match(html, /오늘도자연섬김/);
  assert.match(html, /상품을 검색해 보세요/);
  assert.match(html, /전체상품/);
  assert.match(html, /농산물/);
  assert.match(html, /제철상품/);
  assert.match(html, /선물세트/);
  assert.match(html, /기획전/);
  assert.match(html, /data-cafe24-slot="hero"/);
  assert.match(html, /\/nature-seomgim\/hero-pc\.png/);
  assert.doesNotMatch(html, /수산물|축산물|가공식품/);
  assert.match(html, /지금 많이 찾는 상품/);
  assert.match(html, /산지에서 바로, 이번 주 특별가/);
  assert.match(html, /농산물 상품군별 인기상품/);
  assert.match(html, /자연섬김 기획전/);
  assert.match(html, /회원 전용 가격/);
  assert.match(html, /data-cafe24-slot="featured-products"/);
  assert.match(html, /data-cafe24-slot="season-deals"/);
  assert.match(html, /data-cafe24-slot="farm-groups"/);
  assert.match(html, /data-cafe24-slot="exhibitions"/);
  assert.equal((html.match(/data-preview-product=/g) ?? []).length, 21);
});

export { renderPreview };
