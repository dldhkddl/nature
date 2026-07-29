# 자연섬김 푸르본 Cafe24 이식형 홈페이지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 식품백억의 상품 탐색 흐름을 참고한 자연섬김 농산물 홈페이지를 `/pureubon-preview` 로컬 미리보기 경로에 만들고, 나중에 Cafe24 스마트디자인 모듈로 교체할 위치를 명확히 표시한다.

**Architecture:** 기존 `/`의 담다 AI 도구와 수정 중인 파일은 보존하고, 새 라우트 아래에 콘텐츠 데이터, 재사용 컴포넌트, CSS Module을 분리한다. 화면은 서버 렌더링 가능한 정적 React 구성으로 만들고 복잡한 클라이언트 상태나 Cafe24 API를 사용하지 않는다. 상품과 메뉴는 로컬 예시 데이터로 렌더링하며 각 주요 영역에 `data-cafe24-slot` 속성을 넣어 이식 지점을 표시한다.

**Tech Stack:** Next.js 16.2.6, React 19.2.6, TypeScript 5.9.3, CSS Modules, Node.js 내장 테스트 러너, vinext

## Global Constraints

- 기존 `/` 라우트, `app/page.tsx`, `app/globals.css`, API, 가격 감시 기능과 사용자의 미커밋 변경은 수정하지 않는다.
- 새 화면은 `/pureubon-preview`에서만 제공한다.
- 추가 npm 패키지를 설치하지 않는다.
- 이번 범위에서는 Cafe24 API, 로그인, 주문, 결제, 상품 등록을 연동하지 않는다.
- 상품 대분류는 농산물만 사용한다.
- 내비게이션은 `전체상품 / 농산물 / 제철상품 / 선물세트 / 기획전`으로 고정한다.
- `수산물`, `축산물`, `가공식품` 문구는 새 화면에 포함하지 않는다.
- 자연섬김 색상은 `#F2E7DD`, `#EBE0D4`, `#234837`, `#AB8F70`을 CSS 변수로 사용한다.
- 자연섬김 스마트스토어용 기존 로고, PC·모바일 배너, 아이콘을 재사용한다.
- 식품백억의 코드, 로고, 사진, 고유 문구는 복사하지 않는다.
- PC 4열, 태블릿 3열, 모바일 2열 상품 그리드를 제공한다.
- 로컬 미리보기 전용이므로 Sites 배포와 Cafe24 실제 스킨 변경은 하지 않는다.

## File Map

- Create: `app/pureubon-preview/layout.tsx` — 미리보기 전용 메타데이터
- Create: `app/pureubon-preview/content.ts` — 메뉴, 상품, 빠른 링크, 신뢰 항목 데이터
- Create: `app/pureubon-preview/_components/SiteHeader.tsx` — 유틸리티·로고·검색·카테고리 헤더
- Create: `app/pureubon-preview/_components/ProductCard.tsx` — Cafe24 상품 모듈로 교체 가능한 상품 카드
- Create: `app/pureubon-preview/_components/ProductSection.tsx` — 제목과 상품 그리드 묶음
- Create: `app/pureubon-preview/page.tsx` — 메인 섹션 순서와 Cafe24 슬롯
- Create: `app/pureubon-preview/preview.module.css` — 자연섬김 토큰, 레이아웃, 반응형 스타일
- Create: `public/nature-seomgim/logo.png` — 자연섬김 가로 로고
- Create: `public/nature-seomgim/hero-pc.png` — PC 메인 배너
- Create: `public/nature-seomgim/hero-mobile.png` — 모바일 메인 배너
- Create: `public/nature-seomgim/trust-title.png` — 신뢰 안내 제목 자산
- Create: `public/nature-seomgim/trust-icon.png` — 신뢰 안내 아이콘 자산
- Create: `tests/pureubon-preview.test.mjs` — 빌드된 라우트의 구성 계약 테스트
- Create: `tests/pureubon-preview-styles.test.mjs` — 색상 토큰과 반응형 계약 테스트
- Create: `docs/cafe24/pureubon-homepage-mapping.md` — Cafe24 이식 위치 설명

---

### Task 1: 미리보기 라우트 셸과 브랜드 자산

**Files:**
- Create: `tests/pureubon-preview.test.mjs`
- Create: `public/nature-seomgim/logo.png`
- Create: `public/nature-seomgim/hero-pc.png`
- Create: `public/nature-seomgim/hero-mobile.png`
- Create: `public/nature-seomgim/trust-title.png`
- Create: `public/nature-seomgim/trust-icon.png`
- Create: `app/pureubon-preview/layout.tsx`
- Create: `app/pureubon-preview/content.ts`
- Create: `app/pureubon-preview/_components/SiteHeader.tsx`
- Create: `app/pureubon-preview/page.tsx`
- Create: `app/pureubon-preview/preview.module.css`

**Interfaces:**
- Consumes: 기존 vinext 빌드 결과 `dist/server/index.js`; 기존 스마트스토어 브랜드 이미지
- Produces: `navItems`, `quickLinks`, `/pureubon-preview` 라우트, `data-cafe24-slot="header|category|hero|quick-links"`

- [ ] **Step 1: 라우트 구성 계약 테스트를 작성한다**

Create `tests/pureubon-preview.test.mjs`:

```js
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
});

export { renderPreview };
```

- [ ] **Step 2: 테스트가 라우트 부재로 실패하는지 확인한다**

Run:

```powershell
npm run build
node --test tests/pureubon-preview.test.mjs
```

Expected: `renders the nature-seomgim preview shell`이 `404` 또는 필수 문구 누락으로 FAIL.

- [ ] **Step 3: 브랜드 자산을 미리보기 전용 경로로 복사한다**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'public\nature-seomgim'
Copy-Item -LiteralPath '..\..\outputs\smartstore_final_assets_20260724\05_브랜드로고_타이틀_가로형_620x132.png' -Destination 'public\nature-seomgim\logo.png'
Copy-Item -LiteralPath '..\..\outputs\smartstore_final_assets_20260724\01_프로모션배너_PC_1920x400.png' -Destination 'public\nature-seomgim\hero-pc.png'
Copy-Item -LiteralPath '..\..\outputs\smartstore_final_assets_20260724\02_프로모션배너_모바일_750x600.png' -Destination 'public\nature-seomgim\hero-mobile.png'
Copy-Item -LiteralPath '..\..\outputs\smartstore_final_assets_20260724\07_상단제목아이콘_투명_400x85.png' -Destination 'public\nature-seomgim\trust-title.png'
Copy-Item -LiteralPath '..\..\outputs\smartstore_final_assets_20260724\08_상단아이콘_투명_90x90.png' -Destination 'public\nature-seomgim\trust-icon.png'
```

Expected: `public/nature-seomgim`에 5개 PNG 파일 생성.

- [ ] **Step 4: 헤더용 데이터와 메타데이터를 작성한다**

Create `app/pureubon-preview/content.ts`:

```ts
export type NavItem = {
  label: string;
  href: string;
};

export type QuickLink = {
  label: string;
  description: string;
  href: string;
};

export const navItems: NavItem[] = [
  { label: "전체상품", href: "#all-products" },
  { label: "농산물", href: "#farm-products" },
  { label: "제철상품", href: "#season-deals" },
  { label: "선물세트", href: "#gift-sets" },
  { label: "기획전", href: "#exhibitions" },
];

export const quickLinks: QuickLink[] = [
  { label: "대량구매 문의", description: "수량별 견적 상담", href: "#customer-center" },
  { label: "주문조회", description: "배송 진행 확인", href: "#customer-center" },
  { label: "배송안내", description: "출고·배송 정책", href: "#shipping-guide" },
  { label: "고객센터", description: "운영시간 안내", href: "#customer-center" },
];
```

Create `app/pureubon-preview/layout.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "자연섬김 푸르본 | 산지직송 농산물",
  description: "산지에서 정성껏 선별한 농산물을 소개하는 자연섬김 푸르본 미리보기입니다.",
};

export default function PureubonPreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
```

- [ ] **Step 5: Cafe24 이식 가능한 헤더 컴포넌트를 작성한다**

Create `app/pureubon-preview/_components/SiteHeader.tsx`:

```tsx
import { navItems } from "../content";
import styles from "../preview.module.css";

export function SiteHeader() {
  return (
    <header className={styles.siteHeader} data-cafe24-slot="header">
      <div className={styles.utility}>
        <span>자연을 담은 산지직송 농산물</span>
        <nav aria-label="회원 메뉴">
          <a href="#signup">회원가입</a>
          <a href="#login">로그인</a>
          <a href="#orders">주문조회</a>
          <a href="#customer-center">고객센터</a>
        </nav>
      </div>

      <div className={styles.headerMain}>
        <a className={styles.logo} href="#top" aria-label="오늘도자연섬김 홈">
          <img src="/nature-seomgim/logo.png" alt="오늘도자연섬김" />
        </a>
        <form className={styles.search} role="search">
          <label className={styles.srOnly} htmlFor="pureubon-search">상품 검색</label>
          <input id="pureubon-search" type="search" placeholder="상품을 검색해 보세요" />
          <button type="submit">검색</button>
        </form>
        <div className={styles.accountLinks}>
          <a href="#mypage">마이페이지</a>
          <a href="#cart">장바구니</a>
        </div>
      </div>

      <nav className={styles.categoryNav} data-cafe24-slot="category" aria-label="상품 분류">
        {navItems.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
      </nav>
    </header>
  );
}
```

- [ ] **Step 6: 헤더·배너·빠른 메뉴만 포함한 첫 화면을 작성한다**

Create `app/pureubon-preview/page.tsx`:

```tsx
import { SiteHeader } from "./_components/SiteHeader";
import { quickLinks } from "./content";
import styles from "./preview.module.css";

export default function PureubonPreviewPage() {
  return (
    <div className={styles.preview} id="top">
      <SiteHeader />

      <main>
        <section className={styles.hero} data-cafe24-slot="hero" aria-label="자연섬김 메인 배너">
          <picture>
            <source media="(max-width: 640px)" srcSet="/nature-seomgim/hero-mobile.png" />
            <img src="/nature-seomgim/hero-pc.png" alt="오늘의 제철 과일, 산지에서 가장 맛있는 순간" />
          </picture>
        </section>

        <section className={styles.quickLinks} data-cafe24-slot="quick-links" aria-label="빠른 이용 메뉴">
          {quickLinks.map((item) => (
            <a key={item.label} href={item.href}>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </a>
          ))}
        </section>
      </main>
    </div>
  );
}
```

Create the initial portion of `app/pureubon-preview/preview.module.css`:

```css
.preview {
  --nature-cream: #f2e7dd;
  --nature-beige: #ebe0d4;
  --nature-green: #234837;
  --nature-brown: #ab8f70;
  --nature-ink: #2b332c;
  --nature-white: #ffffff;
  min-height: 100vh;
  background: #fbf8f3;
  color: var(--nature-ink);
}

.preview a { color: inherit; text-decoration: none; }
.preview img { display: block; max-width: 100%; }
.srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
.siteHeader { background: var(--nature-white); border-bottom: 1px solid var(--nature-beige); }
.utility, .headerMain, .categoryNav, .quickLinks {
  width: min(1280px, calc(100% - 48px));
  margin-inline: auto;
}
.utility { min-height: 38px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #6d675f; }
.utility nav, .accountLinks { display: flex; gap: 18px; }
.headerMain { min-height: 96px; display: grid; grid-template-columns: 260px minmax(280px, 1fr) 220px; align-items: center; gap: 32px; }
.logo img { width: 250px; height: auto; }
.search { display: flex; border: 2px solid var(--nature-green); border-radius: 999px; overflow: hidden; background: #fff; }
.search input { min-width: 0; flex: 1; border: 0; padding: 13px 18px; outline: 0; }
.search button { border: 0; padding: 0 22px; background: var(--nature-green); color: #fff; }
.accountLinks { justify-content: flex-end; font-size: 13px; }
.categoryNav { display: flex; align-items: center; justify-content: center; gap: 56px; min-height: 54px; font-weight: 700; }
.hero picture, .hero img { width: 100%; }
.quickLinks { display: grid; grid-template-columns: repeat(4, 1fr); margin-block: 28px 72px; border: 1px solid var(--nature-beige); background: #fff; }
.quickLinks a { padding: 22px; border-right: 1px solid var(--nature-beige); }
.quickLinks a:last-child { border-right: 0; }
.quickLinks strong, .quickLinks span { display: block; }
.quickLinks span { margin-top: 5px; color: #7e756b; font-size: 12px; }
```

- [ ] **Step 7: 빌드와 셸 테스트를 통과시킨다**

Run:

```powershell
npm run build
node --test tests/pureubon-preview.test.mjs
```

Expected: build exit code `0`; test `1 pass, 0 fail`.

- [ ] **Step 8: 첫 라우트 단위를 커밋한다**

Run:

```powershell
git add app/pureubon-preview public/nature-seomgim tests/pureubon-preview.test.mjs
git commit -m "feat: add Pureubon preview shell"
```

Expected: 새 라우트와 브랜드 자산만 포함된 커밋.

---

### Task 2: 상품 진열과 농산물 전용 구성

**Files:**
- Modify: `tests/pureubon-preview.test.mjs`
- Modify: `app/pureubon-preview/content.ts`
- Create: `app/pureubon-preview/_components/ProductCard.tsx`
- Create: `app/pureubon-preview/_components/ProductSection.tsx`
- Modify: `app/pureubon-preview/page.tsx`
- Modify: `app/pureubon-preview/preview.module.css`

**Interfaces:**
- Consumes: `ProductPreview`, `featuredProducts`, `dealProducts`, `farmGroups`
- Produces: `ProductCard({ product })`, `ProductSection({ id, eyebrow, title, description, products, tone })`, `data-cafe24-slot="featured-products|season-deals|farm-groups|exhibitions"`

- [ ] **Step 1: 상품 섹션 계약을 실패 테스트에 추가한다**

Append inside the existing route test after reading `html`:

```js
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
```

- [ ] **Step 2: 테스트가 상품 섹션 누락으로 실패하는지 확인한다**

Run:

```powershell
npm run build
node --test tests/pureubon-preview.test.mjs
```

Expected: `지금 많이 찾는 상품` 또는 `data-preview-product` 단언에서 FAIL.

- [ ] **Step 3: 상품 데이터 계약과 21개 진열 데이터를 추가한다**

Append to `app/pureubon-preview/content.ts`:

```ts
export type ProductPreview = {
  id: string;
  name: string;
  description: string;
  priceLabel: "회원 전용 가격";
  image: string;
  badge?: string;
};

const product = (
  id: string,
  name: string,
  description: string,
  image: string,
  badge?: string,
): ProductPreview => ({
  id,
  name,
  description,
  image,
  badge,
  priceLabel: "회원 전용 가격",
});

export const featuredProducts: ProductPreview[] = [
  product("apple-3kg", "산지직송 햇사과 3kg", "아삭한 식감과 풍부한 과즙", "/samples/apple-main.png", "인기"),
  product("pear-5kg", "프리미엄 신고배 5kg", "선물용으로 정성껏 선별", "/samples/pear-main.png", "추천"),
  product("apple-gift", "사과 선물세트", "고른 빛깔의 실속 구성", "/samples/apple-cut.png"),
  product("season-box", "제철 과일 혼합상자", "계절의 맛을 한 상자에", "/samples/pear-main.png", "제철"),
  product("apple-family", "가정용 실속 사과", "매일 즐기는 산지 과일", "/samples/apple-main.png"),
  product("pear-family", "가정용 실속 배", "달고 시원한 제철 배", "/samples/pear-main.png"),
  product("apple-premium", "프리미엄 사과 특선", "선별과 포장에 정성을 더한 구성", "/samples/apple-cut.png", "특선"),
  product("fruit-bulk", "사업자용 과일 대량구매", "수량별 맞춤 상담 상품", "/samples/apple-main.png", "대량구매"),
];

export const dealProducts: ProductPreview[] = [
  product("deal-apple", "이번 주 사과 특가", "산지 물량 한정 구성", "/samples/apple-main.png", "특가"),
  product("deal-pear", "이번 주 배 특가", "신선 출고 한정 수량", "/samples/pear-main.png", "특가"),
  product("deal-gift", "제철 선물상자", "감사의 마음을 담은 포장", "/samples/apple-cut.png", "제철"),
  product("deal-bulk", "농산물 대량구매 기획", "사업자 회원 전용 상담", "/samples/pear-main.png", "기획"),
];

export const farmGroups = [
  {
    id: "season-fruit",
    title: "제철 과일",
    description: "가장 맛있는 때에 선별한 산지 과일",
    products: featuredProducts.slice(0, 3),
  },
  {
    id: "farm-specialties",
    title: "채소·특산물",
    description: "산지의 개성을 담은 믿을 수 있는 채소와 특산물",
    products: featuredProducts.slice(3, 6),
  },
  {
    id: "gift-sets",
    title: "선물세트",
    description: "받는 분의 마음까지 생각한 정성 포장",
    products: featuredProducts.slice(5, 8),
  },
] as const;
```

- [ ] **Step 4: 상품 카드와 공통 상품 섹션을 작성한다**

Create `app/pureubon-preview/_components/ProductCard.tsx`:

```tsx
import type { ProductPreview } from "../content";
import styles from "../preview.module.css";

export function ProductCard({ product }: { product: ProductPreview }) {
  return (
    <article className={styles.productCard} data-preview-product={product.id}>
      <a href={`#product-${product.id}`} aria-label={`${product.name} 상세 보기`}>
        <div className={styles.productImage}>
          <img src={product.image} alt="" />
          {product.badge ? <span>{product.badge}</span> : null}
        </div>
        <div className={styles.productBody}>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <strong>{product.priceLabel}</strong>
        </div>
      </a>
    </article>
  );
}
```

Create `app/pureubon-preview/_components/ProductSection.tsx`:

```tsx
import type { ProductPreview } from "../content";
import { ProductCard } from "./ProductCard";
import styles from "../preview.module.css";

type ProductSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  products: readonly ProductPreview[];
  tone?: "default" | "beige";
};

export function ProductSection({
  id,
  eyebrow,
  title,
  description,
  products,
  tone = "default",
}: ProductSectionProps) {
  return (
    <section id={id} className={`${styles.productSection} ${tone === "beige" ? styles.beigeSection : ""}`}>
      <div className={styles.sectionHeading}>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className={styles.productGrid}>
        {products.map((item) => <ProductCard key={item.id} product={item} />)}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: 메인 화면에 상품 진열 순서를 구현한다**

Update the imports in `app/pureubon-preview/page.tsx`:

```tsx
import { ProductCard } from "./_components/ProductCard";
import { ProductSection } from "./_components/ProductSection";
import { dealProducts, farmGroups, featuredProducts, quickLinks } from "./content";
```

Insert after the quick links section:

```tsx
<div data-cafe24-slot="featured-products">
  <ProductSection
    id="all-products"
    eyebrow="BEST PRODUCTS"
    title="지금 많이 찾는 상품"
    description="자연섬김 고객이 먼저 찾은 산지 농산물입니다."
    products={featuredProducts}
  />
</div>

<div data-cafe24-slot="season-deals">
  <ProductSection
    id="season-deals"
    eyebrow="WEEKLY SPECIAL"
    title="산지에서 바로, 이번 주 특별가"
    description="제철 물량을 좋은 조건으로 준비했습니다."
    products={dealProducts}
    tone="beige"
  />
</div>

<section id="farm-products" className={styles.farmGroups} data-cafe24-slot="farm-groups">
  <div className={styles.sectionHeading}>
    <span>FARM COLLECTION</span>
    <h2>농산물 상품군별 인기상품</h2>
    <p>제철 과일부터 정성스러운 선물세트까지 만나보세요.</p>
  </div>
  {farmGroups.map((group) => (
    <div className={styles.farmGroup} id={group.id} key={group.id}>
      <div>
        <h3>{group.title}</h3>
        <p>{group.description}</p>
      </div>
      <div className={styles.compactGrid}>
        {group.products.map((item) => <ProductCard key={`${group.id}-${item.id}`} product={item} />)}
      </div>
    </div>
  ))}
</section>

<section id="exhibitions" className={styles.exhibition} data-cafe24-slot="exhibitions">
  <div>
    <span>CURATED FOR YOU</span>
    <h2>자연섬김 기획전</h2>
    <p>제철상품, 선물세트, 대량구매 상품을 한곳에서 확인하세요.</p>
  </div>
  <a href="#season-deals">기획상품 보러가기</a>
</section>
```

- [ ] **Step 6: 상품 카드와 진열 레이아웃 스타일을 추가한다**

Append to `app/pureubon-preview/preview.module.css`:

```css
.productSection, .farmGroups { padding: 88px max(24px, calc((100% - 1280px) / 2)); }
.beigeSection { background: var(--nature-cream); }
.sectionHeading { max-width: 620px; margin-bottom: 34px; }
.sectionHeading > span { color: var(--nature-brown); font-size: 11px; font-weight: 800; letter-spacing: .16em; }
.sectionHeading h2 { margin: 10px 0 8px; color: var(--nature-green); font-size: clamp(28px, 3vw, 42px); letter-spacing: -.04em; }
.sectionHeading p { margin: 0; color: #786f65; }
.productGrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 28px 20px; }
.productCard { min-width: 0; background: #fff; border: 1px solid #ece4d9; }
.productImage { position: relative; aspect-ratio: 1 / .86; overflow: hidden; background: var(--nature-beige); }
.productImage img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s ease; }
.productCard:hover .productImage img { transform: scale(1.025); }
.productImage span { position: absolute; top: 12px; left: 12px; padding: 6px 9px; background: var(--nature-green); color: #fff; font-size: 11px; }
.productBody { padding: 18px; }
.productBody h3 { margin: 0; font-size: 17px; line-height: 1.45; }
.productBody p { min-height: 36px; margin: 7px 0 16px; color: #7b736b; font-size: 13px; line-height: 1.5; }
.productBody strong { color: var(--nature-green); font-size: 14px; }
.farmGroups { background: #fff; }
.farmGroup { display: grid; grid-template-columns: 240px 1fr; gap: 48px; padding: 34px 0; border-top: 1px solid var(--nature-beige); }
.farmGroup > div:first-child h3 { margin: 0 0 8px; color: var(--nature-green); font-size: 24px; }
.farmGroup > div:first-child p { margin: 0; color: #786f65; line-height: 1.65; }
.compactGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.exhibition { display: flex; align-items: center; justify-content: space-between; gap: 32px; padding: 62px max(24px, calc((100% - 1280px) / 2)); background: var(--nature-green); color: #fff; }
.exhibition span { color: #d8c7ad; font-size: 11px; letter-spacing: .16em; }
.exhibition h2 { margin: 10px 0 7px; font-size: 36px; }
.exhibition p { margin: 0; color: #dce5dd; }
.exhibition a { flex: none; padding: 14px 22px; border: 1px solid #fff; }
```

- [ ] **Step 7: 상품 진열 테스트를 통과시킨다**

Run:

```powershell
npm run build
node --test tests/pureubon-preview.test.mjs
```

Expected: 상품 섹션, Cafe24 슬롯, 21개 카드 단언을 포함해 PASS.

- [ ] **Step 8: 상품 진열 단위를 커밋한다**

Run:

```powershell
git add app/pureubon-preview tests/pureubon-preview.test.mjs
git commit -m "feat: add Pureubon produce sections"
```

Expected: 상품 콘텐츠, 컴포넌트, 진열 스타일만 포함된 커밋.

---

### Task 3: 브랜드 이야기, 신뢰 안내, 하단 정보와 반응형

**Files:**
- Modify: `tests/pureubon-preview.test.mjs`
- Create: `tests/pureubon-preview-styles.test.mjs`
- Modify: `app/pureubon-preview/content.ts`
- Modify: `app/pureubon-preview/page.tsx`
- Modify: `app/pureubon-preview/preview.module.css`

**Interfaces:**
- Consumes: `trustItems`
- Produces: `data-cafe24-slot="brand-story|trust-guide|footer"`, PC·태블릿·모바일 반응형 계약

- [ ] **Step 1: 브랜드·하단·스타일 계약 테스트를 작성한다**

Append to the route test:

```js
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
```

Create `tests/pureubon-preview-styles.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cssUrl = new URL("../app/pureubon-preview/preview.module.css", import.meta.url);

test("uses the approved nature-seomgim palette and responsive grids", async () => {
  const css = await readFile(cssUrl, "utf8");

  assert.match(css, /--nature-cream:\s*#f2e7dd/i);
  assert.match(css, /--nature-beige:\s*#ebe0d4/i);
  assert.match(css, /--nature-green:\s*#234837/i);
  assert.match(css, /--nature-brown:\s*#ab8f70/i);
  assert.match(css, /@media\s*\(max-width:\s*960px\)/i);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/i);
  assert.match(css, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/i);
  assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/i);
});
```

- [ ] **Step 2: 테스트가 브랜드 섹션과 반응형 규칙 누락으로 실패하는지 확인한다**

Run:

```powershell
npm run build
node --test tests/pureubon-preview.test.mjs tests/pureubon-preview-styles.test.mjs
```

Expected: 브랜드 문구 또는 `@media` 단언에서 FAIL.

- [ ] **Step 3: 신뢰 안내 데이터를 추가한다**

Append to `app/pureubon-preview/content.ts`:

```ts
export const trustItems = [
  { title: "산지 직송", description: "산지에서 선별한 농산물을 바로 보냅니다." },
  { title: "꼼꼼한 선별", description: "상품 상태와 품질을 세심하게 확인합니다." },
  { title: "안전한 포장", description: "배송 중 손상을 줄이도록 정성껏 포장합니다." },
  { title: "신속한 배송", description: "신선함을 지킬 수 있도록 빠르게 출고합니다." },
] as const;
```

- [ ] **Step 4: 브랜드 이야기, 신뢰 안내, 하단 정보를 페이지에 추가한다**

Update the content import:

```tsx
import { dealProducts, farmGroups, featuredProducts, quickLinks, trustItems } from "./content";
```

Insert after the exhibition section:

```tsx
<section className={styles.brandStory} data-cafe24-slot="brand-story">
  <div>
    <span>OUR STORY</span>
    <h2>자연섬김 이야기</h2>
    <p>자연이 키우고 농부가 지킨 농산물을 정직한 마음으로 선별해 전합니다.</p>
    <a href="#brand-story">브랜드 이야기 보기</a>
  </div>
  <img src="/nature-seomgim/hero-mobile.png" alt="정성껏 준비한 자연섬김 제철 농산물" />
</section>

<section id="shipping-guide" className={styles.trustGuide} data-cafe24-slot="trust-guide">
  <div className={styles.trustTitle}>
    <img src="/nature-seomgim/trust-title.png" alt="" />
    <h2>자연섬김이 약속합니다</h2>
  </div>
  <div className={styles.trustGrid}>
    {trustItems.map((item) => (
      <article key={item.title}>
        <img src="/nature-seomgim/trust-icon.png" alt="" />
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </article>
    ))}
  </div>
</section>
```

Insert immediately before the closing preview `div`:

```tsx
<footer id="customer-center" className={styles.footer} data-cafe24-slot="footer">
  <div>
    <strong>오늘도자연섬김</strong>
    <p>산지에서 정성껏 선별한 농산물을 전합니다.</p>
  </div>
  <div>
    <h2>고객센터</h2>
    <p>평일 09:00–18:00 · 점심 12:00–13:00</p>
    <a href="#shipping-guide">배송 · 교환 · 반품 안내</a>
  </div>
  <div>
    <h2>쇼핑몰 안내</h2>
    <a href="#terms">이용약관</a>
    <a href="#privacy">개인정보처리방침</a>
    <p>사업자 정보는 Cafe24 관리자 등록 정보를 연결합니다.</p>
  </div>
</footer>
```

- [ ] **Step 5: 브랜드·하단·반응형 스타일을 구현한다**

Append to `app/pureubon-preview/preview.module.css`:

```css
.brandStory { display: grid; grid-template-columns: 1fr 1fr; min-height: 560px; background: #fff; }
.brandStory > div { display: flex; flex-direction: column; justify-content: center; padding: 72px max(32px, calc((100vw - 1280px) / 2)); padding-right: 64px; }
.brandStory > div > span { color: var(--nature-brown); font-size: 11px; letter-spacing: .16em; }
.brandStory h2 { margin: 12px 0; color: var(--nature-green); font-size: 42px; }
.brandStory p { max-width: 480px; color: #70685f; font-size: 16px; line-height: 1.9; }
.brandStory a { align-self: flex-start; margin-top: 18px; padding-bottom: 5px; border-bottom: 1px solid var(--nature-green); color: var(--nature-green); font-weight: 700; }
.brandStory > img { width: 100%; height: 100%; object-fit: cover; }
.trustGuide { padding: 78px max(24px, calc((100% - 1280px) / 2)); background: var(--nature-cream); }
.trustTitle { text-align: center; }
.trustTitle img { width: 220px; margin: 0 auto 10px; }
.trustTitle h2 { margin: 0; color: var(--nature-green); font-size: 34px; }
.trustGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-top: 38px; }
.trustGrid article { padding: 30px 22px; background: #fff; text-align: center; }
.trustGrid article img { width: 52px; margin: 0 auto 15px; }
.trustGrid h3 { margin: 0 0 8px; color: var(--nature-green); }
.trustGrid p { margin: 0; color: #786f65; font-size: 13px; line-height: 1.65; }
.footer { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 64px; padding: 58px max(24px, calc((100% - 1280px) / 2)); background: #1b392b; color: #dce5dd; }
.footer strong { color: #fff; font-size: 22px; }
.footer h2 { margin: 0 0 12px; color: #fff; font-size: 15px; }
.footer p, .footer a { display: block; margin: 7px 0; color: #b9c8bc; font-size: 12px; line-height: 1.65; }

@media (max-width: 960px) {
  .headerMain { grid-template-columns: 200px 1fr; }
  .accountLinks { display: none; }
  .categoryNav { justify-content: flex-start; gap: 30px; overflow-x: auto; }
  .productGrid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .farmGroup { grid-template-columns: 1fr; gap: 20px; }
  .compactGrid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .trustGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .footer { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 640px) {
  .utility { display: none; }
  .headerMain { min-height: auto; grid-template-columns: 1fr; gap: 14px; padding-block: 18px; }
  .logo img { width: 210px; margin-inline: auto; }
  .categoryNav { width: 100%; padding-inline: 18px; gap: 24px; }
  .quickLinks { width: calc(100% - 32px); grid-template-columns: repeat(2, 1fr); margin-block: 18px 50px; }
  .quickLinks a { border-bottom: 1px solid var(--nature-beige); }
  .productSection, .farmGroups { padding-block: 58px; }
  .productGrid, .compactGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 10px; }
  .productBody { padding: 13px; }
  .productBody h3 { font-size: 14px; }
  .productBody p { font-size: 11px; }
  .exhibition { align-items: flex-start; flex-direction: column; }
  .brandStory { grid-template-columns: 1fr; }
  .brandStory > div { padding: 58px 24px; }
  .brandStory > img { max-height: 430px; }
  .trustGrid, .footer { grid-template-columns: 1fr; }
  .footer { gap: 34px; }
}
```

- [ ] **Step 6: 접근성 세부사항을 보완한다**

Insert immediately after the opening `<main>` in `app/pureubon-preview/page.tsx`:

```tsx
<h1 className={styles.srOnly}>자연섬김 산지직송 농산물</h1>
```

Add these exact rules to the CSS:

```css
.preview a:focus-visible,
.preview button:focus-visible,
.preview input:focus-visible {
  outline: 3px solid #ab8f70;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .productImage img { transition: none; }
}
```

Confirm:

- 모든 이미지에 `alt`가 있거나 장식 이미지는 `alt=""`.
- 페이지의 `h1`은 메인 배너 이미지의 시각 문구를 보완하도록 숨김 제목 `자연섬김 산지직송 농산물`을 한 개 추가.
- 검색 입력은 `label`과 연결.
- 링크·버튼은 키보드 포커스 표시.

- [ ] **Step 7: 전체 콘텐츠와 스타일 테스트를 통과시킨다**

Run:

```powershell
npm run build
node --test tests/pureubon-preview.test.mjs tests/pureubon-preview-styles.test.mjs
npm exec eslint -- app/pureubon-preview tests/pureubon-preview.test.mjs tests/pureubon-preview-styles.test.mjs
```

Expected: build `0`; tests `2 pass, 0 fail`; 새 라우트 대상 lint error `0`.

- [ ] **Step 8: 브랜드·반응형 단위를 커밋한다**

Run:

```powershell
git add app/pureubon-preview tests/pureubon-preview.test.mjs tests/pureubon-preview-styles.test.mjs
git commit -m "feat: finish Pureubon responsive homepage"
```

Expected: 브랜드 이야기, 신뢰 안내, footer, 반응형 규칙만 포함된 커밋.

---

### Task 4: Cafe24 이식 지도와 최종 로컬 검증

**Files:**
- Create: `docs/cafe24/pureubon-homepage-mapping.md`
- Verify: `app/pureubon-preview/page.tsx`
- Verify: `app/pureubon-preview/preview.module.css`
- Verify: `tests/pureubon-preview.test.mjs`
- Verify: `tests/pureubon-preview-styles.test.mjs`

**Interfaces:**
- Consumes: 페이지의 `data-cafe24-slot` 값
- Produces: Cafe24 스킨 편집 시 사용할 슬롯별 이식 체크리스트

- [ ] **Step 1: Cafe24 이식 지도를 작성한다**

Create `docs/cafe24/pureubon-homepage-mapping.md`:

```md
# 자연섬김 홈페이지 Cafe24 이식 지도

## 적용 전

1. Cafe24 관리자에서 현재 사용 중인 디자인을 복사한다.
2. 복사본의 스마트디자인 편집창에서 실제 공통 레이아웃, `index.html`, CSS 경로를 확인한다.
3. 실제 운영 디자인이 아닌 복사본에 먼저 적용한다.

## 슬롯 매핑

| 로컬 슬롯 | Cafe24 적용 대상 | 운영 데이터 |
|---|---|---|
| `header` | 공통 레이아웃 머리글 | 회원, 로그인, 주문조회, 장바구니 링크 |
| `category` | 상품분류 모듈 | 농산물 분류와 진열 그룹 |
| `hero` | 메인 배너 영역 | PC·모바일 자연섬김 배너 |
| `quick-links` | 직접 HTML 링크 영역 | 대량구매, 주문조회, 배송, 고객센터 |
| `featured-products` | 메인 상품진열 모듈 | 인기상품 8개 |
| `season-deals` | 메인 상품진열 모듈 | 제철·특가상품 4개 이상 |
| `farm-groups` | 농산물 진열 모듈 묶음 | 제철 과일, 채소·특산물, 선물세트 |
| `exhibitions` | 기획전 링크 또는 배너 | 운영 중인 농산물 기획전 |
| `brand-story` | 직접 HTML·이미지 영역 | 자연섬김 소개 |
| `trust-guide` | 직접 HTML·아이콘 영역 | 배송·품질 약속 |
| `footer` | 공통 레이아웃 바닥글 | 고객센터, 약관, 개인정보, 사업자 정보 |

## 이식 원칙

- 로컬의 예시 상품 카드를 그대로 복사하지 않고 Cafe24 상품진열 모듈의 반복 항목에 카드 CSS를 적용한다.
- 상품명, 가격, 이미지, 상세 링크는 Cafe24 모듈 변수를 사용한다.
- 회원 전용 가격 설정은 Cafe24 회원등급과 상품 표시 정책을 따른다.
- 주문, 결제, 회원가입, 마이페이지는 Cafe24 기본 페이지를 사용한다.
- 스킨마다 파일 경로와 모듈 ID가 다르므로 현재 스킨에서 확인한 값만 사용한다.
```

- [ ] **Step 2: 슬롯과 문서가 일치하는지 확인한다**

Run:

```powershell
$slots = @('header','category','hero','quick-links','featured-products','season-deals','farm-groups','exhibitions','brand-story','trust-guide','footer')
foreach ($slot in $slots) {
  rg -q \"data-cafe24-slot=\\\"$slot\\\"\" 'app\pureubon-preview'
  if ($LASTEXITCODE -ne 0) { throw \"Missing page slot: $slot\" }
  rg -q \"``$slot``\" 'docs\cafe24\pureubon-homepage-mapping.md'
  if ($LASTEXITCODE -ne 0) { throw \"Missing mapping row: $slot\" }
}
```

Expected: 출력 없이 exit code `0`.

- [ ] **Step 3: 전체 빌드와 새 기능 테스트를 최종 실행한다**

Run:

```powershell
npm run build
node --test tests/pureubon-preview.test.mjs tests/pureubon-preview-styles.test.mjs
```

Expected: build exit code `0`; tests `2 pass, 0 fail`.

기존 `tests/rendered-html.test.mjs`는 현재 담다 AI 루트와 맞지 않는 스타터 전용 테스트이므로 이번 커밋에서 수정하거나 성공으로 주장하지 않는다. 별도 정리 작업으로 다룬다.

- [ ] **Step 4: 로컬 미리보기를 실행해 사용자에게 연다**

Run:

```powershell
npm run dev
```

Use the exact Local URL printed by the server and append `/pureubon-preview`. For example, when the printed URL is `http://localhost:3000`, open `http://localhost:3000/pureubon-preview`. Do not assume port `3000`; use the printed port.

Verify only:

- 자연섬김 로고와 PC 배너가 표시된다.
- 상품 대분류가 농산물로 제한된다.
- 상품 카드가 PC 4열로 표시된다.
- 창 너비를 줄였을 때 태블릿 3열, 모바일 2열로 변한다.
- 가로 스크롤이 생기지 않는다.
- 사용자가 위치와 색상을 조정할 수 있도록 CSS 변수가 파일 상단에 모여 있다.

- [ ] **Step 5: 문서와 최종 상태를 커밋한다**

Run:

```powershell
git add docs/cafe24/pureubon-homepage-mapping.md
git commit -m "docs: map Pureubon preview to Cafe24"
```

Expected: Cafe24 이식 지도만 포함된 커밋. 검증 과정에서 변경이 없으면 추가 코드 커밋을 만들지 않는다.

- [ ] **Step 6: 사용자에게 로컬 미리보기 경로와 다음 선택을 전달한다**

Report:

- 로컬 미리보기 URL
- 구현된 메인 구성
- 자연섬김 실제 색상값
- Cafe24 이식은 별도 승인 후 진행된다는 점
- 사용자 조정 대상은 `app/pureubon-preview/preview.module.css` 상단 CSS 변수와 `page.tsx`의 섹션 순서라는 점
