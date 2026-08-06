# Four-Input Channel Auto-Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이미지, 판매가, 상품명, 용량만 입력하면 네이버 스마트스토어와 카페24의 나머지 필수값을 자동 완성하고 검증 후 등록한다.

**Architecture:** 순수 함수 모듈이 네 가지 입력을 정규화하고 채널 공통 자동값을 만든다. 채널별 서버 모듈이 공식 API의 카테고리, 이미지, 상품, 재고 계약을 담당하며 등록 라우트는 검증·중복 방지·등록 후 확인을 순서대로 조정한다. 화면은 네 가지 입력만 기본 노출하고 자동 생성 결과와 예외만 보여준다.

**Tech Stack:** TypeScript 5.9, React 19, Next.js/Vinext, Cloudflare Workers, Node test runner, Naver Commerce API, Cafe24 Admin API 2025-06-01

## Global Constraints

- 상품별 기본 입력은 이미지, 판매가, 상품명, 용량 네 가지뿐이다.
- 기본 재고는 정확히 30개다.
- 원산지는 국산이고 신선 농산물의 과세유형은 면세다.
- 입력 상품명을 보존하며 용량은 이름에 없을 때만 한 번 추가한다.
- 판매자 상품코드는 네이버 30자와 카페24 40자 제한을 동시에 만족하고 동일 상품에서 채널 공통으로 사용한다.
- 확정할 수 없는 카테고리나 판매자 기본설정 누락은 추측 등록하지 않고 한국어 오류로 중단한다.
- 실제 외부 상품 생성은 코드·계약 테스트 완료 후 별도 승인받은 시험 상품 한 개로만 검증한다.
- 새 런타임 의존성은 추가하지 않는다.

---

## File Structure

- Create `app/lib/autoRegistration.ts`: 네 가지 입력 정규화, 제목·상품코드·기본값 생성.
- Create `app/lib/categoryResolution.ts`: 채널 카테고리 후보 점수화와 확정 기준.
- Create `app/api/cafe24/categories/route.ts`: 연결된 카페24의 카테고리 검색.
- Modify `app/lib/cafe24.ts`: 이미지 선업로드, 상품 생성, 품목 재고, 재조회, 공개 전환 API.
- Modify `app/api/cafe24/register/route.ts`: 카페24 자동등록 오케스트레이션.
- Modify `app/lib/naver.ts`: 카테고리 조회와 등록 후 상품 확인 기능.
- Modify `app/api/naver/categories/route.ts`: 공통 카테고리 조회 함수를 재사용.
- Modify `app/api/naver/register/route.ts`: 네 가지 입력에서 네이버 요청 전체를 자동 완성.
- Modify `app/api/cafe24/oauth/start/route.ts`: 카페24 카테고리 읽기 권한 추가.
- Modify `app/page.tsx`: 네 가지 기본 입력, 자동값 미리보기, 채널 요청 단순화.
- Modify `app/lib/products.ts`: 새 상품의 기본 재고 30개와 자동등록 상태 저장.
- Create `tests/auto-registration.test.ts`: 정규화와 자동값 계약.
- Create `tests/category-resolution.test.ts`: 카테고리 확정/중단 계약.
- Create `tests/cafe24-registration.test.ts`: 카페24 요청 순서와 필드 계약.
- Extend `tests/naver-registration-validation.test.ts`: 네이버 자동 기본값 계약.

---

### Task 1: Four-Input Normalization and Stable Defaults

**Files:**
- Create: `app/lib/autoRegistration.ts`
- Modify: `app/lib/products.ts`
- Test: `tests/auto-registration.test.ts`

**Interfaces:**
- Produces: `parseSalePrice(value): number | null`
- Produces: `resolveAutoTitle(productName, capacity): string`
- Produces: `makeSellerProductCode(productId): string`
- Produces: `prepareAutoRegistration(input): AutoRegistrationResult`

- [ ] **Step 1: Write failing normalization tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  makeSellerProductCode,
  parseSalePrice,
  prepareAutoRegistration,
  resolveAutoTitle,
} from "../app/lib/autoRegistration.ts";

test("normalizes decorated prices", () => {
  assert.equal(parseSalePrice("39,900원"), 39900);
  assert.equal(parseSalePrice("0"), null);
});

test("preserves the entered name and appends capacity once", () => {
  assert.equal(resolveAutoTitle("국산 백도복숭아", "2kg"), "국산 백도복숭아 2kg");
  assert.equal(resolveAutoTitle("국산 백도복숭아 2kg", "2kg"), "국산 백도복숭아 2kg");
});

test("creates the same bounded code for the same product", () => {
  const first = makeSellerProductCode("p-example-123");
  assert.equal(first, makeSellerProductCode("p-example-123"));
  assert.match(first, /^FB-[A-Z0-9]+$/);
  assert.ok(first.length <= 30);
});

test("fills the agreed automatic product values", () => {
  const result = prepareAutoRegistration({
    productId: "p-example-123",
    productName: "국산 백도복숭아",
    capacity: "500g x 4개",
    price: "39,900원",
    imageCount: 2,
  });
  assert.deepEqual(result.issues, []);
  assert.equal(result.value?.stock, 30);
  assert.equal(result.value?.supplyPrice, 39900);
  assert.equal(result.value?.origin, "국산");
  assert.equal(result.value?.taxType, "면세");
});
```

- [ ] **Step 2: Run the test and verify missing-module failure**

Run: `node --experimental-strip-types --test tests/auto-registration.test.ts`

Expected: FAIL because `app/lib/autoRegistration.ts` does not exist.

- [ ] **Step 3: Implement the pure automatic-value module**

```ts
export type AutoRegistrationValue = {
  title: string;
  capacity: string;
  price: number;
  supplyPrice: number;
  stock: 30;
  sellerProductCode: string;
  origin: "국산";
  taxType: "면세";
};

export type AutoRegistrationResult = {
  value?: AutoRegistrationValue;
  issues: { field: "productName" | "capacity" | "price" | "images"; message: string }[];
};

export function parseSalePrice(value: unknown): number | null {
  const normalized = String(value ?? "").trim().replace(/[,\s원]/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function resolveAutoTitle(productName: unknown, capacity: unknown): string {
  const name = String(productName ?? "").trim().replace(/\s+/g, " ");
  const size = String(capacity ?? "").trim().replace(/\s+/g, " ");
  return size && !name.toLowerCase().includes(size.toLowerCase()) ? `${name} ${size}`.trim() : name;
}
```

Implement `makeSellerProductCode` with a deterministic 32-bit FNV-1a hash rendered as uppercase base36 and prefixed with `FB-`. Implement `prepareAutoRegistration` to collect all four missing-input errors in one pass and return the agreed fixed values only when no issue remains.

- [ ] **Step 4: Set new products to stock 30 without overwriting imported stock**

Change `newProduct()` defaults to include `stock: "30"`, `origin: "국산"`, and `supplyPrice: ""`; keep `...seed?.data` last so imported data remains authoritative.

- [ ] **Step 5: Run focused and full tests**

Run: `node --experimental-strip-types --test tests/auto-registration.test.ts`

Expected: PASS.

Run: `npm.cmd test`

Expected: all existing tests plus the new tests pass.

---

### Task 2: Confidence-Gated Channel Category Resolution

**Files:**
- Create: `app/lib/categoryResolution.ts`
- Create: `app/api/cafe24/categories/route.ts`
- Modify: `app/api/naver/categories/route.ts`
- Modify: `app/api/cafe24/oauth/start/route.ts`
- Modify: `app/lib/cafe24.ts`
- Test: `tests/category-resolution.test.ts`

**Interfaces:**
- Consumes: normalized title from `prepareAutoRegistration`
- Produces: `CategoryCandidate`
- Produces: `chooseCategory(query, candidates): CategoryDecision`
- Produces: `listCafe24Categories(input): Promise<CategoryCandidate[]>`

- [ ] **Step 1: Write failing category decision tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { chooseCategory } from "../app/lib/categoryResolution.ts";

test("selects a clearly matching leaf category", () => {
  const result = chooseCategory("국산 백도복숭아 2kg", [
    { id: "10", name: "복숭아", path: "식품>농산물>과일>복숭아", leaf: true },
    { id: "11", name: "사과", path: "식품>농산물>과일>사과", leaf: true },
  ]);
  assert.equal(result.status, "selected");
  assert.equal(result.category?.id, "10");
});

test("stops when candidates are ambiguous", () => {
  const result = chooseCategory("과일 선물세트", [
    { id: "10", name: "과일선물세트", path: "식품>과일", leaf: true },
    { id: "11", name: "혼합과일세트", path: "식품>과일", leaf: true },
  ]);
  assert.equal(result.status, "ambiguous");
});
```

- [ ] **Step 2: Run the test and verify missing-module failure**

Run: `node --experimental-strip-types --test tests/category-resolution.test.ts`

Expected: FAIL because `categoryResolution.ts` does not exist.

- [ ] **Step 3: Implement deterministic category scoring**

```ts
export type CategoryCandidate = { id: string; name: string; path: string; leaf: boolean };
export type CategoryDecision = {
  status: "selected" | "ambiguous" | "not-found";
  category?: CategoryCandidate;
  candidates: CategoryCandidate[];
};
```

Normalize punctuation and spacing, remove capacity tokens, score exact name match `100`, category-name containment `70`, and shared meaningful title tokens `10` each. Select only a leaf candidate whose score is at least `70` and at least `15` points above the runner-up; otherwise return candidates without choosing.

- [ ] **Step 4: Add Cafe24 category API support**

Add `mall.read_category` to the OAuth scopes. Implement `listCafe24Categories` using:

```text
GET /api/v2/admin/categories?shop_no=1&category_name=<query>&limit=100
Authorization: Bearer <token>
X-Cafe24-Api-Version: 2025-06-01
```

Map `category_no`, `category_name`, `full_category_name`, and category depth to `CategoryCandidate`. The new route must obtain a refreshed token through `getValidCafe24Token`, call this function, run `chooseCategory`, and return `{ decision }` without changing external state.

- [ ] **Step 5: Reuse the category decision in the Naver category route**

Keep the existing official category fetch, map leaf results to `CategoryCandidate`, and include `decision: chooseCategory(query, candidates)` in the response while preserving the existing `categories` property for `NaverCategoryPicker` compatibility.

- [ ] **Step 6: Run focused and full tests**

Run: `node --experimental-strip-types --test tests/category-resolution.test.ts`

Expected: PASS for confident, ambiguous, and missing matches.

Run: `npm.cmd test`

Expected: all tests pass.

---

### Task 3: Cafe24 API Contract and Safe Registration Pipeline

**Files:**
- Modify: `app/lib/cafe24.ts`
- Test: `tests/cafe24-registration.test.ts`

**Interfaces:**
- Consumes: `AutoRegistrationValue` and confirmed Cafe24 category number
- Produces: `registerCafe24Product(input): Promise<Cafe24RegistrationResult>`
- Produces: `verifyCafe24Product(expected, actual): string[]`

- [ ] **Step 1: Write failing Cafe24 payload tests**

```ts
test("builds every required Cafe24 product field", () => {
  const payload = buildCafe24ProductPayload({
    mallId: "demo",
    accessToken: "token",
    productName: "국산 백도복숭아 2kg",
    customProductCode: "FB-ABC123",
    categoryNo: 27,
    price: 39900,
    supplyPrice: 39900,
    stock: 30,
    deliveryFeeType: "FREE",
    shippingInfo: "CJ대한통운 택배",
    exchangeInfo: "반품·교환은 판매자에게 문의해 주세요.",
    serviceInfo: "상담전화 010-0000-0000",
    imagePaths: ["/web/product/a.jpg", "/web/product/b.jpg"],
    descriptionHtml: "<p>상세</p>",
  });
  assert.equal(payload.request.supply_price, "39900");
  assert.equal(payload.request.custom_product_code, "FB-ABC123");
  assert.deepEqual(payload.request.add_category_no, [{ category_no: 27 }]);
  assert.equal(payload.request.tax_type, "B");
  assert.equal(payload.request.shipping_fee_by_product, "T");
  assert.equal(payload.request.shipping_fee_type, "T");
  assert.equal(payload.request.shipping_scope, "A");
  assert.match(payload.request.service_info, /010-0000-0000/);
  assert.equal(payload.request.display, "F");
  assert.equal(payload.request.selling, "F");
  assert.deepEqual(payload.request.additional_image, ["/web/product/b.jpg"]);
});
```

Add fetch-mock tests asserting this sequence:

```text
GET products?custom_product_code=FB-ABC123
POST products/images
POST products
GET products/{product_no}/variants
PUT products/{product_no}/variants/{variant_code}/inventories
GET products/{product_no}
PUT products/{product_no}
```

- [ ] **Step 2: Run the test and verify contract failures**

Run: `node --experimental-strip-types --test tests/cafe24-registration.test.ts`

Expected: FAIL because supply price is optional, the additional-image field is incorrect, and orchestration functions are absent.

- [ ] **Step 3: Replace the unverified Cafe24 payload**

Make `supplyPrice`, `customProductCode`, `categoryNo`, `stock`, `deliveryFeeType`, `shippingInfo`, `exchangeInfo`, `serviceInfo`, and `imagePaths` required. Build a hidden product with:

```ts
{
  product_name: input.productName,
  custom_product_code: input.customProductCode,
  price: String(input.price),
  supply_price: String(input.supplyPrice),
  add_category_no: [{ category_no: input.categoryNo }],
  product_condition: "N",
  tax_type: "B",
  origin_classification: "F",
  shipping_fee_by_product: "T",
  shipping_scope: "A",
  shipping_method: "01",
  shipping_fee_type: input.deliveryFeeType === "FREE" ? "T" : "R",
  prepaid_shipping_fee: "P",
  product_shipping_type: "D",
  shipping_info: input.shippingInfo,
  exchange_info: input.exchangeInfo,
  service_info: input.serviceInfo,
  display: "F",
  selling: "F",
  image_upload_type: "A",
  detail_image: input.imagePaths[0],
  additional_image: input.imagePaths.slice(1, 20),
  description: input.descriptionHtml ?? "",
}
```

- [ ] **Step 4: Implement image pre-upload and strict response parsing**

Fetch each public image URL server-side, reject non-image responses and files over 10MB, convert bytes to Base64, and send batches whose total decoded size stays below 30MB to `POST /api/v2/admin/products/images`. Parse returned `images[].path` or `image.path`; throw `Cafe24ApiError("카페24 이미지 업로드 결과에 이미지 경로가 없습니다.", 502, data)` when no path is returned.

- [ ] **Step 5: Implement duplicate-safe hidden creation, inventory, verification, and publish**

Search by `custom_product_code` before creation. Resume an existing hidden product instead of creating a second product. Retrieve its first variant, set `use_inventory: "T"`, `quantity: 30`, `inventory_control_type: "A"`, and `display_soldout: "T"`. Re-read the product and compare product name, price, custom product code, representative image presence, and inventory quantity. Only when all comparisons pass, update the product to `{ display: "T", selling: "T" }`.

- [ ] **Step 6: Run focused and full tests**

Run: `node --experimental-strip-types --test tests/cafe24-registration.test.ts`

Expected: PASS, including resume-after-partial-failure and verification-mismatch tests.

Run: `npm.cmd test`

Expected: all tests pass.

---

### Task 4: Cafe24 Automatic Registration Route

**Files:**
- Modify: `app/api/cafe24/register/route.ts`
- Modify: `app/lib/registrationError.ts`
- Test: `tests/cafe24-registration.test.ts`

**Interfaces:**
- Consumes JSON: `{ productId, productName, capacity, price, images, descriptionHtml, sellerDefaults }`
- Produces JSON: `{ ok, productNo, normalized, verification }`

- [ ] **Step 1: Add failing route-level validation cases**

Cover decorated prices, missing capacity, missing public image, missing seller default contact/delivery values, ambiguous category, and repeated submission with the same product ID. Assert that field errors use `{ field, message }` and are Korean.

- [ ] **Step 2: Run the focused test and observe failures**

Run: `node --experimental-strip-types --test tests/cafe24-registration.test.ts`

Expected: FAIL because the route accepts only title, price, summary, description, and images.

- [ ] **Step 3: Build all automatic values inside the server route**

Call `prepareAutoRegistration`, resolve a Cafe24 category with `listCafe24Categories` and `chooseCategory`, and call `registerCafe24Product`. Do not trust client-supplied stock, supply price, origin, tax type, seller code, or category as authoritative.

Return HTTP 400 with all local issues, HTTP 409 for unresolved category or duplicate conflict, the Cafe24 status for API errors, and HTTP 502 for registration-after-read verification mismatch.

- [ ] **Step 4: Add stage-aware Korean Cafe24 errors**

Extend `Cafe24ApiError` with a stage union of `인증 | 카테고리 조회 | 이미지 업로드 | 상품 생성 | 재고 설정 | 등록 확인 | 판매 공개`. Include the stage in route responses and have `formatRegistrationError` render it before the API message.

- [ ] **Step 5: Run tests**

Run: `npm.cmd test`

Expected: all tests pass and existing Naver error translations remain unchanged.

---

### Task 5: Naver Four-Input Automatic Registration

**Files:**
- Modify: `app/lib/naver.ts`
- Modify: `app/api/naver/register/route.ts`
- Modify: `app/api/naver/categories/route.ts`
- Extend: `tests/naver-registration-validation.test.ts`
- Extend: `tests/naver-product-payload.test.ts`

**Interfaces:**
- Consumes multipart fields: `productId`, `productName`, `capacity`, `price`, `images`, and serialized seller defaults
- Produces: normalized values and registered Naver product number

- [ ] **Step 1: Write failing tests for server-generated Naver values**

Assert that a request with product ID, product name, `500g x 4개`, `39,900원`, images, and complete seller defaults produces title `상품명 500g x 4개`, stock `30`, a stable seller code, domestic origin, duty-free payload, and inferred unit-price fields. Assert that ambiguous category resolution blocks API submission.

- [ ] **Step 2: Run focused tests and observe missing automatic behavior**

Run: `node --experimental-strip-types --test tests/naver-registration-validation.test.ts tests/naver-product-payload.test.ts`

Expected: FAIL because category, code, and stock are currently required from the client.

- [ ] **Step 3: Move automatic values and category selection into the Naver route**

Use `prepareAutoRegistration` for title, price, stock, and seller code. Fetch official Naver categories, run `chooseCategory`, infer unit price from capacity, and merge seller defaults for courier, claim fees, AS phone, producer, and storage. Keep explicit product-level values only as backward-compatible overrides for imported products, never as requirements for the four-input editor.

- [ ] **Step 4: Add duty-free payload and post-create verification**

Set `originProduct.detailAttribute.taxType` to the official `DUTYFREE` enum in `buildNaverProductPayload`. Add `retrieveProduct(accessToken, productNo)` and compare name, sale price, stock, seller management code, and representative image. Return a verification error instead of success when values differ.

- [ ] **Step 5: Run focused and full tests**

Run: `node --experimental-strip-types --test tests/naver-registration-validation.test.ts tests/naver-product-payload.test.ts`

Expected: PASS.

Run: `npm.cmd test`

Expected: all tests pass.

---

### Task 6: Four-Input Editor and Automatic Result Preview

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Modify: `app/lib/products.ts`
- Test: `tests/auto-registration.test.ts`

**Interfaces:**
- Consumes: existing `Product`, `SellerDefaults`, `orderedImages`
- Produces: both channel requests containing only the four product inputs plus stored seller defaults

- [ ] **Step 1: Add pure helper tests for editor projection**

Add `toFourInputFields(product)` tests proving that only `productName`, `price`, `weightSpec`, and ordered images are projected, while seller defaults remain separate.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --experimental-strip-types --test tests/auto-registration.test.ts`

Expected: FAIL because the projection helper is absent.

- [ ] **Step 3: Reduce the primary editor to the agreed inputs**

Keep the existing image manager. Show only 상품명, 판매가, 용량 in the text form. Replace stock, origin, category, producer, storage, variety, shipping, and feature controls with a read-only “자동 입력” summary showing 국산, 면세, 재고 30개, generated seller code, seller default courier, and resolved channel categories. Preserve old fields in stored data so imported spreadsheets are not destroyed.

- [ ] **Step 4: Simplify channel request builders**

`registerProductToNaver` and `registerProductToCafe24` must send `productId`, raw product name, capacity, raw price, ordered images, generated detail HTML, and `loadSellerDefaults()`. Remove client-side requirements for category, seller code, stock, origin, and unit-price overrides from the four-input path.

- [ ] **Step 5: Show automatic blocking issues at their source**

Map server issues to 상품명, 판매가, 용량, 이미지, or 판매자 기본설정. For ambiguous categories, show the candidate names under “자동 입력” and retain the existing manual picker only as an exception control.

- [ ] **Step 6: Run tests, lint, and build**

Run: `npm.cmd test`

Expected: all tests pass.

Run: `npm.cmd run lint`

Expected: zero ESLint errors; pre-existing warnings may remain unchanged.

Run: `npm.cmd run build`

Expected: production build succeeds.

---

### Task 7: Non-Mutating End-to-End Contract Verification

**Files:**
- Modify: `tests/cafe24-registration.test.ts`
- Modify: `tests/naver-product-payload.test.ts`
- Modify: `docs/superpowers/specs/2026-08-06-four-input-channel-auto-registration-design.md` only if verified API behavior requires a factual correction

**Interfaces:**
- Consumes: final routes and mocked channel responses
- Produces: release evidence without creating a real external product

- [ ] **Step 1: Add a complete mocked happy path for each channel**

Use the same four-input fixture for both channels and assert title, 39900 price, 30 stock, common seller code, domestic origin, duty-free tax, representative image, category assignment, and registration-after-read verification.

- [ ] **Step 2: Add failure and recovery paths**

Cover expired token refresh, category ambiguity, image upload failure, duplicate retry, inventory failure, product-read mismatch, and a retry resuming the existing hidden Cafe24 product.

- [ ] **Step 3: Run the complete verification suite**

Run: `npm.cmd test`

Expected: all tests pass with no skipped tests.

Run: `npm.cmd run lint`

Expected: zero errors.

Run: `npm.cmd run build`

Expected: build succeeds.

- [ ] **Step 4: Prepare the live pilot handoff**

Report the exact normalized payload summary and ask for explicit approval before creating one real hidden test product on Naver or Cafe24. Do not issue an external create request as part of automated verification.
