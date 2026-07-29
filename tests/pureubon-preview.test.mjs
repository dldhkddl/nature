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
  assert.match(html, /\/nature-seomgim\/logo-transparent\.png/);
  assert.match(html, /상품을 검색해 보세요/);
  assert.match(html, /전체상품/);
  assert.match(html, /마이페이지/);
  assert.match(html, /장바구니/);
  assert.match(html, /고객센터/);
  assert.match(html, /전체상품/);
  assert.match(html, /농산물/);
  assert.match(html, /제철상품/);
  assert.match(html, /선물세트/);
  assert.match(html, /기획전/);
  assert.match(html, /data-cafe24-slot="hero"/);
  assert.match(html, /data-cafe24-slot="hero-account-panel"/);
  assert.match(html, /자연섬김과 함께 신선한 장보기를 시작하세요/);
  assert.equal((html.match(/data-member-shortcut=/g) ?? []).length, 6);
  assert.match(html, /\/nature-seomgim\/hero-peach-pc\.png/);
  assert.doesNotMatch(html, /\/nature-seomgim\/hero-pc\.png/);
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
  assert.match(html, /자연섬김 이야기/);
  assert.match(html, /산지 직송/);
  assert.match(html, /꼼꼼한 선별/);
  assert.match(html, /안전한 포장/);
  assert.match(html, /신속한 배송/);
  assert.match(html, /고객센터/);
  assert.match(html, /배송 · 교환 · 반품 안내/);
  assert.match(html, /data-cafe24-slot="brand-story"/);
  assert.match(html, /data-cafe24-slot="trust-guide"/);
  assert.match(html, /data-cafe24-slot="footer"/);
});

export { renderPreview };
