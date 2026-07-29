import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { inflateSync } from "node:zlib";

const originalHeroUrl = new URL(
  "../public/nature-seomgim/hero-pc.png",
  import.meta.url,
);
const premiumHeroUrl = new URL(
  "../public/nature-seomgim/hero-premium-editorial-pc.png",
  import.meta.url,
);

async function decodePng(url) {
  const png = await readFile(url);
  const idatChunks = [];
  let width;
  let height;
  let channels;

  for (let offset = 8; offset < png.length; ) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8, "hero PNG must use 8-bit color");
      assert.ok(
        data[9] === 2 || data[9] === 6,
        "hero PNG must use RGB or RGBA color",
      );
      channels = data[9] === 2 ? 3 : 4;
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }

    offset += length + 12;
  }

  const filtered = inflateSync(Buffer.concat(idatChunks));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);

  const paeth = (left, above, upperLeft) => {
    const prediction = left + above - upperLeft;
    const leftDistance = Math.abs(prediction - left);
    const aboveDistance = Math.abs(prediction - above);
    const upperLeftDistance = Math.abs(prediction - upperLeft);
    if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
      return left;
    }
    return aboveDistance <= upperLeftDistance ? above : upperLeft;
  };

  for (let y = 0; y < height; y += 1) {
    const filter = filtered[y * (stride + 1)];
    const sourceOffset = y * (stride + 1) + 1;
    const targetOffset = y * stride;

    for (let x = 0; x < stride; x += 1) {
      const raw = filtered[sourceOffset + x];
      const left = x >= channels ? pixels[targetOffset + x - channels] : 0;
      const above = y > 0 ? pixels[targetOffset + x - stride] : 0;
      const upperLeft =
        y > 0 && x >= channels
          ? pixels[targetOffset + x - stride - channels]
          : 0;
      const reconstructed =
        filter === 0
          ? raw
          : filter === 1
            ? raw + left
            : filter === 2
              ? raw + above
              : filter === 3
                ? raw + Math.floor((left + above) / 2)
                : raw + paeth(left, above, upperLeft);
      pixels[targetOffset + x] = reconstructed & 0xff;
    }
  }

  return { width, height, channels, pixels };
}

function cropPixels(image, region) {
  const rowBytes = region.width * image.channels;
  const result = Buffer.alloc(rowBytes * region.height);

  for (let y = 0; y < region.height; y += 1) {
    const sourceOffset =
      ((region.top + y) * image.width + region.left) * image.channels;
    image.pixels.copy(result, y * rowBytes, sourceOffset, sourceOffset + rowBytes);
  }

  return result;
}

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
  assert.match(html, /자연섬김 홈/);
  assert.match(html, /\/nature-seomgim\/logo-nature-seomgim\.png/);
  assert.doesNotMatch(html, /오늘도자연섬김/);
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
  assert.match(html, /\/nature-seomgim\/hero-premium-editorial-pc\.png/);
  assert.doesNotMatch(html, /\/nature-seomgim\/hero-gift-box-pc\.png/);
  assert.doesNotMatch(html, /\/nature-seomgim\/hero-peach-pc\.png/);
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

test("uses the premium editorial hero artwork", async () => {
  const [original, premiumHero] = await Promise.all([
    decodePng(originalHeroUrl),
    decodePng(premiumHeroUrl),
  ]);

  assert.deepEqual([premiumHero.width, premiumHero.height], [1695, 600]);
  assert.ok(
    premiumHero.channels === 3 || premiumHero.channels === 4,
    "premium hero must use RGB or RGBA color",
  );

  const fruitRegion = { left: 760, top: 80, width: 620, height: 300 };
  const originalFruitPixels = cropPixels(original, fruitRegion);
  const premiumFruitPixels = cropPixels(premiumHero, fruitRegion);
  assert.notDeepEqual(premiumFruitPixels, originalFruitPixels);
});

export { renderPreview };
