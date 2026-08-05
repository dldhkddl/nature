# SmartStore Category Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 상품별 네이버 말단 카테고리와 공통 필수값을 등록 전·API 요청 시 동일하게 검사하고, 현재의 테스트·린트 기반을 정상화한다.

**Architecture:** 부작용 없는 공유 검증 모듈을 클라이언트와 API가 함께 사용한다. 상품 편집기는 네이버 카테고리 검색 결과의 ID와 경로를 상품 데이터에 저장하고, 등록 UI와 API는 동일한 오류 목록을 기준으로 실패를 차단한다.

**Tech Stack:** React 19, TypeScript 5.9, vinext/Next App Router, Cloudflare Workers, Node test runner

## Global Constraints

- 개인용 범위를 유지하고 로그인·권한·다중 사용자 기능을 추가하지 않는다.
- 공통 필수값은 상품명, 네이버 말단 카테고리, 판매가, 재고, 대표 이미지, 원산지로 제한한다.
- 판매가와 재고는 쉼표를 제외한 값이 0보다 큰 정수여야 한다.
- 카테고리별 상품정보제공고시·속성 검사는 이번 범위에서 제외한다.
- `NAVER_LEAF_CATEGORY_ID` 고정값으로 등록하지 않고 상품별 `category`를 사용한다.
- 기존 작업 트리가 크게 수정된 상태이므로 관련 없는 리팩터링과 일괄 포맷 변경을 하지 않는다.
- 이미 수정된 파일의 기존 사용자 변경을 별도 구현 커밋에 포함하지 않는다.
- 배포와 브라우저 UI 자동화는 이번 작업 범위가 아니다.

---

## File Structure

- Create `app/lib/naverRegistrationValidation.ts` — 클라이언트와 API가 공유하는 순수 검증 함수와 타입
- Create `app/components/NaverCategoryPicker.tsx` — 상품별 네이버 카테고리 검색·선택 UI
- Create `tests/naver-registration-validation.test.ts` — 검증 규칙 단위 테스트
- Modify `app/page.tsx` — 상품별 카테고리 저장, 등록 준비 표시, 등록 전 검사, category 전송
- Modify `app/api/naver/register/route.ts` — 상품별 category 수신 및 서버 측 재검사
- Modify `app/components/ChannelExcel.tsx` — effect 내 동기 상태 변경 린트 오류 제거
- Modify `app/components/MarginCalculator.tsx` — 로컬 설정 초기화와 가격 동기화 린트 오류 제거
- Modify `package.json` — 현재 제품 테스트 명령으로 교체
- Modify `worker/index.ts` — 사용하지 않는 고정 카테고리 환경 타입 제거
- Modify `.dev.vars.example` — 사용하지 않는 `NAVER_LEAF_CATEGORY_ID` 안내 제거
- Modify `app/globals.css` — 카테고리 검색과 등록 준비 표시 최소 스타일
- Delete `tests/rendered-html.test.mjs` — 제거된 초기 Sites 스켈레톤 전용 테스트

---

### Task 1: 공유 필수값 검증기를 테스트 우선으로 추가

**Files:**
- Create: `tests/naver-registration-validation.test.ts`
- Create: `app/lib/naverRegistrationValidation.ts`
- Modify: `package.json:8-14`
- Delete: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: `validateNaverRegistration(input: NaverRegistrationInput): NaverRegistrationIssue[]`
- Produces: `NaverRegistrationField`, `NaverRegistrationInput`, `NaverRegistrationIssue`

- [ ] **Step 1: 기존 실패의 원인을 기준선으로 기록**

Run: `node --test tests/rendered-html.test.mjs`

Expected: 제거된 `app/_sites-preview` 참조와 `cloudflare:` 모듈 로딩 때문에 2개 테스트가 실패한다.

- [ ] **Step 2: 공유 검증기의 실패 테스트 작성**

Create `tests/naver-registration-validation.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { validateNaverRegistration } from "../app/lib/naverRegistrationValidation.ts";

const valid = {
  title: "경북 부사 사과 3kg",
  category: "50002160",
  price: "39,900",
  stock: "100",
  origin: "경상북도 영주시",
  imageCount: 2,
};

test("accepts a complete SmartStore registration candidate", () => {
  assert.deepEqual(validateNaverRegistration(valid), []);
});

test("returns every missing required field in one pass", () => {
  assert.deepEqual(
    validateNaverRegistration({ title: "", category: "", price: "", stock: "", origin: "", imageCount: 0 })
      .map((issue) => issue.field),
    ["title", "category", "price", "stock", "images", "origin"],
  );
});

test("rejects a non-numeric category id", () => {
  assert.equal(validateNaverRegistration({ ...valid, category: "사과" })[0]?.field, "category");
});

test("rejects zero, negative, decimal, and decorated price or stock values", () => {
  for (const value of ["0", "-1", "1.5", "만원"]) {
    assert.ok(validateNaverRegistration({ ...valid, price: value }).some((issue) => issue.field === "price"));
    assert.ok(validateNaverRegistration({ ...valid, stock: value }).some((issue) => issue.field === "stock"));
  }
});
```

- [ ] **Step 3: 테스트 명령을 현재 제품에 맞게 교체하고 RED 확인**

Set `package.json` script:

```json
"test": "node --experimental-strip-types --test tests/*.test.ts"
```

Delete `tests/rendered-html.test.mjs`.

Run: `npm.cmd test`

Expected: `app/lib/naverRegistrationValidation.ts`가 아직 없어 FAIL.

- [ ] **Step 4: 최소 검증 구현 작성**

Create `app/lib/naverRegistrationValidation.ts`:

```ts
export type NaverRegistrationField = "title" | "category" | "price" | "stock" | "images" | "origin";

export type NaverRegistrationInput = {
  title?: unknown;
  category?: unknown;
  price?: unknown;
  stock?: unknown;
  origin?: unknown;
  imageCount?: number;
};

export type NaverRegistrationIssue = {
  field: NaverRegistrationField;
  message: string;
};

function isPositiveInteger(value: unknown): boolean {
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  return /^\d+$/.test(normalized) && Number.isSafeInteger(Number(normalized)) && Number(normalized) > 0;
}

export function validateNaverRegistration(input: NaverRegistrationInput): NaverRegistrationIssue[] {
  const issues: NaverRegistrationIssue[] = [];
  if (!String(input.title ?? "").trim()) issues.push({ field: "title", message: "상품명을 입력해 주세요." });
  const category = String(input.category ?? "").trim();
  if (!/^\d+$/.test(category)) issues.push({ field: "category", message: "네이버 카테고리를 선택해 주세요." });
  if (!isPositiveInteger(input.price)) issues.push({ field: "price", message: "판매가는 0보다 큰 정수로 입력해 주세요." });
  if (!isPositiveInteger(input.stock)) issues.push({ field: "stock", message: "재고는 0보다 큰 정수로 입력해 주세요." });
  if (!Number.isInteger(input.imageCount) || (input.imageCount ?? 0) < 1) issues.push({ field: "images", message: "대표 이미지를 1장 이상 추가해 주세요." });
  if (!String(input.origin ?? "").trim()) issues.push({ field: "origin", message: "원산지를 입력해 주세요." });
  return issues;
}
```

- [ ] **Step 5: GREEN 확인**

Run: `npm.cmd test`

Expected: 4 tests PASS.

---

### Task 2: 상품별 네이버 카테고리 선택 UI 추가

**Files:**
- Create: `app/components/NaverCategoryPicker.tsx`
- Modify: `app/page.tsx:3-29,153-188,388-417,710-813,839-844`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `GET /api/naver/categories?q=<query>`
- Produces: `NaverCategoryPicker({ categoryId, categoryName, suggestedQuery, onSelect, onNotice })`
- Produces: 상품 데이터의 `category`와 `categoryName`

- [ ] **Step 1: 카테고리 선택 컴포넌트 작성**

Create a focused client component with this public contract:

```ts
type FoundCategory = { id: string; name: string; path: string };

type Props = {
  categoryId: string;
  categoryName: string;
  suggestedQuery: string;
  onSelect: (category: FoundCategory) => void;
  onNotice?: (message: string) => void;
};
```

Required behavior:

```tsx
<label>
  <span>네이버 카테고리 <strong>*</strong></span>
  <input value={query} onChange={(event) => setQuery(event.target.value)} />
</label>
<button type="button" onClick={search} disabled={searching || !query.trim()}>카테고리 검색</button>
```

`search()` must URL-encode the query, handle non-2xx JSON errors, show all returned leaf categories, and call `onSelect` only when the user clicks a result. It must never guess or auto-select a category.

- [ ] **Step 2: 상품 데이터를 부분 갱신하는 함수 추가**

In `app/page.tsx`, add:

```ts
function updateProductData(patch: Partial<CanonicalRow>) {
  if (!editing) return;
  commit(upsert(products, { ...editing, data: { ...editing.data, ...patch } }));
}
```

Use it from `NaverCategoryPicker`:

```tsx
<NaverCategoryPicker
  categoryId={String(editing.data.category ?? "")}
  categoryName={String(editing.data.categoryName ?? "")}
  suggestedQuery={product.name || product.variety}
  onSelect={(category) => updateProductData({
    category: category.id,
    categoryName: category.path || category.name,
  })}
  onNotice={setNotice}
/>
```

- [ ] **Step 3: 등록 준비 상태를 공유 검증기로 계산하고 표시**

Add:

```ts
const naverIssues = editing
  ? validateNaverRegistration({
      title: editing.data.productName,
      category: editing.data.category,
      price: editing.data.price,
      stock: editing.data.stock,
      origin: editing.data.origin,
      imageCount: orderedImages(editing).length,
    })
  : [];
```

Render all messages near the Naver registration action. Disable only the Naver button when `naverIssues.length > 0`; Cafe24 behavior stays unchanged.

- [ ] **Step 4: 최소 스타일 추가**

Add scoped classes for `.naverCategoryPicker`, `.naverCategoryResults`, `.naverReadiness`, `.naverReadiness.ready`, and `.naverReadiness.blocked`. Reuse existing colors, borders, radii, and button classes; do not restyle unrelated surfaces.

- [ ] **Step 5: 정적 검증**

Run: `npm.cmd run build`

Expected: TypeScript and vinext build PASS.

---

### Task 3: 네이버 등록 API를 상품별 카테고리와 서버 검증으로 전환

**Files:**
- Modify: `app/page.tsx:388-417,537-568`
- Modify: `app/api/naver/register/route.ts:9-120`
- Modify: `worker/index.ts:5-23`
- Modify: `.dev.vars.example`

**Interfaces:**
- Consumes: form field `category`
- Consumes: `validateNaverRegistration`
- Produces on validation failure: `{ error: string, issues: NaverRegistrationIssue[] }` with HTTP 400

- [ ] **Step 1: 클라이언트 등록 함수에서 같은 검증을 적용**

Before image conversion or `fetch`, run `validateNaverRegistration`. On failure return all messages joined with `·`. On success append:

```ts
form.append("category", String(p.data.category ?? ""));
```

This automatically protects normal registration and quick registration because both paths call `registerProductToNaver`.

- [ ] **Step 2: API에서 폼을 읽은 직후 서버 검증**

Read `category` from the form and call:

```ts
const issues = validateNaverRegistration({
  title,
  category,
  price: priceRaw,
  stock: stockRaw,
  origin,
  imageCount: files.length,
});

if (issues.length) {
  return Response.json(
    { error: "등록 필수값을 확인해 주세요.", issues },
    { status: 400 },
  );
}
```

Pass `category` as `leafCategoryId` to `registerProduct`.

- [ ] **Step 3: 고정 카테고리 환경 설정 제거**

Remove `NAVER_LEAF_CATEGORY_ID` from the route environment type, `worker/index.ts`, and `.dev.vars.example`. Do not change other Naver credentials or origin/A/S defaults.

- [ ] **Step 4: 검증 회귀 테스트**

Run: `npm.cmd test`

Expected: all validation tests PASS.

---

### Task 4: 기존 린트 오류 4개를 원인에 맞게 제거

**Files:**
- Modify: `app/components/ChannelExcel.tsx:76-113,399`
- Modify: `app/components/MarginCalculator.tsx:45-69`
- Modify: `app/components/ChannelExcel.tsx:342-348`

**Interfaces:**
- Preserves: channel template loading behavior
- Preserves: saved cost/fee loading and current product price behavior

- [ ] **Step 1: 린트 실패를 재현**

Run: `npm.cmd run lint`

Expected: `react-hooks/set-state-in-effect` errors at ChannelExcel 91/98 and MarginCalculator 62/68.

- [ ] **Step 2: ChannelExcel 초기화와 채널 전환 책임 분리**

Initialize local template storage lazily:

```ts
const [store, setStore] = useState<TemplateStore>(() => loadTemplates());
```

Remove the mount effect that only calls `setStore`. Change the channel button handler to reset presentation state at the user event boundary:

```ts
onClick={() => {
  setChannelId(channel.id);
  setExpanded(false);
  setAnalysis(null);
}}
```

Keep async built-in template loading in the effect and update `analysis` only after an awaited operation. Preserve the cancellation guard.

- [ ] **Step 3: MarginCalculator 초기값과 상품 전환을 remount로 처리**

Use lazy initializers:

```ts
const [cost, setCost] = useState<CostInput>(() => loadCost());
const [fees, setFees] = useState<Record<string, FeeInput>>(() => loadFees());
```

Remove both state-setting effects. In `ChannelExcel`, give `MarginCalculator` a key containing the selected product ID and current price so a product/price change creates the correct new initial state:

```tsx
key={`${products[0]?.id ?? "none"}:${products[0]?.data.price ?? ""}`}
```

- [ ] **Step 4: 린트 GREEN 확인**

Run: `npm.cmd run lint`

Expected: 0 errors. Existing `<img>` and `price-watcher` warnings may remain because they are unrelated to this scope.

---

### Task 5: 전체 검증 및 변경 범위 확인

**Files:**
- Verify all files listed above

**Interfaces:**
- Produces: buildable, lint-clean, tested product registration flow

- [ ] **Step 1: 단위 테스트 실행**

Run: `npm.cmd test`

Expected: all tests PASS.

- [ ] **Step 2: 린트 실행**

Run: `npm.cmd run lint`

Expected: 0 errors.

- [ ] **Step 3: Sites 배포 빌드 실행**

Run: `npm.cmd run build`

Expected: vinext build PASS and `/api/naver/register`, `/api/naver/categories` routes are present.

- [ ] **Step 4: diff 안전성 검사**

Run: `git diff --check`

Expected: whitespace errors 없음.

Run: `git status --short`

Expected: 기존 사용자 변경은 보존되고, 이번 작업 파일만 추가·수정되어 있다. 기존 변경과 겹치는 파일은 최종 보고에서 명시한다.

- [ ] **Step 5: 구현 결과 보고**

Report the category selection flow, required fields, server-side protection, exact verification results, and any pre-existing warnings separately. Do not claim browser interaction testing because it is outside this approved scope.

