# Duplicate Product Code Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 중복된 판매자 상품코드의 영향 상품과 수정 위치를 표시하고 한 번의 동작으로 해당 입력칸에 이동하게 한다.

**Architecture:** `products.ts`가 중복 코드와 영향 상품 ID를 계산하는 단일 순수 함수를 제공한다. `ProductList`는 이 결과로 경고 목록과 행 오류 상태를 렌더링하고, `Home`은 수정 요청을 받아 상품 편집창을 연 뒤 상품코드 입력칸을 포커스한다.

**Tech Stack:** TypeScript 5.9, React 19, Node test runner, CSS

## Global Constraints

- 상품코드는 사용자가 직접 수정하며 자동 생성하거나 자동 변경하지 않는다.
- 빈 상품코드는 중복으로 취급하지 않는다.
- 같은 코드가 세 상품 이상에 있어도 모든 영향 상품을 표시한다.
- 색상뿐 아니라 배지와 텍스트로 오류를 전달한다.
- 기존 상품 선택, 검색, 편집, 저장 흐름을 유지한다.
- 기존 작업 트리가 광범위하게 수정되어 있으므로 구현 파일은 사용자 변경과 분리할 수 있을 때만 커밋한다. 분리할 수 없으면 검증 결과만 남기고 구현 커밋은 생략한다.

---

## File Structure

- Modify: `app/lib/products.ts` — 코드별 영향 상품 그룹 계산
- Create: `tests/duplicate-product-codes.test.ts` — 중복 그룹 판정 회귀 테스트
- Modify: `app/components/ProductList.tsx` — 영향 상품 목록, 수정 버튼, 행 강조
- Modify: `app/page.tsx` — 수정 요청 처리, 상품코드 입력과 오류 상태, 포커스
- Modify: `app/globals.css` — 경고 목록, 오류 행, 오류 입력 스타일

### Task 1: 중복 코드 그룹 계산

**Files:**
- Modify: `app/lib/products.ts:183-192`
- Create: `tests/duplicate-product-codes.test.ts`

**Interfaces:**
- Consumes: `Product[]`, 각 상품의 `data.sellerProductCode`
- Produces: `type DuplicateCodeGroup = { code: string; productIds: string[] }`
- Produces: `duplicateCodeGroups(list: Product[]): DuplicateCodeGroup[]`
- Preserves: `duplicateCodes(list: Product[]): string[]`

- [ ] **Step 1: Write the failing tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { duplicateCodeGroups, type Product } from "../app/lib/products.ts";

function product(id: string, code: string): Product {
  return {
    id,
    data: { productName: id, sellerProductCode: code },
    images: [],
    createdAt: "2026-08-05T00:00:00.000Z",
    updatedAt: "2026-08-05T00:00:00.000Z",
  };
}

test("groups every product affected by the same duplicate code", () => {
  assert.deepEqual(
    duplicateCodeGroups([
      product("apple-1", "PE-YE-2"),
      product("apple-2", "PE-YE-2"),
      product("apple-3", "PE-YE-2"),
      product("pear-1", "PE-YE-4"),
      product("pear-2", "PE-YE-4"),
    ]),
    [
      { code: "PE-YE-2", productIds: ["apple-1", "apple-2", "apple-3"] },
      { code: "PE-YE-4", productIds: ["pear-1", "pear-2"] },
    ],
  );
});

test("ignores blank and unique product codes", () => {
  assert.deepEqual(
    duplicateCodeGroups([
      product("blank-1", ""),
      product("blank-2", "   "),
      product("unique", "ONLY-1"),
    ]),
    [],
  );
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --experimental-strip-types --test tests/duplicate-product-codes.test.ts`

Expected: FAIL because `duplicateCodeGroups` is not exported.

- [ ] **Step 3: Implement the group function and preserve the old API**

```ts
export type DuplicateCodeGroup = {
  code: string;
  productIds: string[];
};

export function duplicateCodeGroups(list: Product[]): DuplicateCodeGroup[] {
  const byCode = new Map<string, string[]>();
  for (const product of list) {
    const code = String(product.data.sellerProductCode ?? "").trim();
    if (!code) continue;
    byCode.set(code, [...(byCode.get(code) ?? []), product.id]);
  }
  return [...byCode.entries()]
    .filter(([, productIds]) => productIds.length > 1)
    .map(([code, productIds]) => ({ code, productIds }));
}

export function duplicateCodes(list: Product[]): string[] {
  return duplicateCodeGroups(list).map((group) => group.code);
}
```

- [ ] **Step 4: Run the focused and full test suites**

Run: `node --experimental-strip-types --test tests/duplicate-product-codes.test.ts`

Expected: 2 tests pass.

Run: `npm.cmd test`

Expected: all tests pass.

- [ ] **Step 5: Commit when the files can be isolated safely**

```powershell
git add -- app/lib/products.ts tests/duplicate-product-codes.test.ts
git commit -m "feat: group duplicate product codes"
```

If `app/lib/products.ts` is still an untracked user-owned file containing unrelated work, skip this commit rather than snapshotting unrelated changes.

### Task 2: 영향 상품 목록과 오류 행 표시

**Files:**
- Modify: `app/components/ProductList.tsx:12-18,45-49,85-91,122-137`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `duplicateCodeGroups(products)` from Task 1
- Produces: `onFixDuplicate: (id: string) => void` prop
- Produces: code-group warning rows and `duplicate` row class

- [ ] **Step 1: Replace code-only warning data with grouped data**

```tsx
import {
  duplicateCodeGroups,
  orderedImages,
  productLabel,
  searchProducts,
  type Product,
} from "../lib/products";

type Props = {
  products: Product[];
  selectedIds: string[];
  editingId: string | null;
  onSelect: (ids: string[]) => void;
  onEdit: (id: string | null) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (ids: string[]) => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onFixDuplicate: (id: string) => void;
  busy?: boolean;
};

const duplicateGroups = useMemo(() => duplicateCodeGroups(products), [products]);
const duplicateIds = useMemo(
  () => new Set(duplicateGroups.flatMap((group) => group.productIds)),
  [duplicateGroups],
);
const duplicateCodes = new Set(duplicateGroups.map((group) => group.code));
```

- [ ] **Step 2: Render every affected product below its code**

```tsx
{duplicateGroups.length > 0 && (
  <div className="plistDuplicateAlert" role="alert">
    <b>중복 상품코드를 수정해 주세요</b>
    <p>이대로 등록하면 채널에서 기존 상품을 덮어쓸 수 있습니다.</p>
    {duplicateGroups.map((group) => (
      <div className="plistDuplicateGroup" key={group.code}>
        <code>{group.code}</code>
        <ul>
          {group.productIds.map((id) => {
            const product = products.find((candidate) => candidate.id === id);
            if (!product) return null;
            return (
              <li key={id}>
                <span>{productLabel(product)}</span>
                <button
                  type="button"
                  className="linkBtn"
                  onClick={() => onFixDuplicate(id)}
                  aria-label={`${productLabel(product)} 상품코드 수정하기`}
                >
                  수정하기
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 3: Add row-level error state without changing selection behavior**

```tsx
<div
  className={`plistRow ${isEditing ? "editing" : ""} ${selected.has(p.id) ? "on" : ""} ${duplicateIds.has(p.id) ? "duplicate" : ""}`}
  key={p.id}
>
```

Keep the existing `코드중복` badge, changing its condition to `duplicateCodes.has(code)`.

- [ ] **Step 4: Add accessible warning and error styles**

```css
.plistDuplicateAlert{margin:12px 0 18px;padding:14px;border:1px solid #d98a7c;border-radius:10px;background:#fff3f0;color:#7a3025}
.plistDuplicateAlert>p{margin:4px 0 12px;font-size:11px}
.plistDuplicateGroup{display:grid;grid-template-columns:minmax(90px,auto) 1fr;gap:12px;padding-top:9px;border-top:1px solid #efd2cc}
.plistDuplicateGroup+ .plistDuplicateGroup{margin-top:9px}
.plistDuplicateGroup ul{list-style:none;margin:0;padding:0}
.plistDuplicateGroup li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:3px 0}
.plistRow.duplicate{border-color:#d5614e;background:#fff8f6}
```

- [ ] **Step 5: Run static verification**

Run: `npm.cmd run lint`

Expected: 0 errors.

Run: `npm.cmd run build`

Expected: build succeeds.

### Task 3: 상품코드 입력 오류와 포커스 연결

**Files:**
- Modify: `app/page.tsx:3,7-23,69-80,157-172,725-736,836-850`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `duplicateCodeGroups(products)` from Task 1
- Consumes: `onFixDuplicate(id)` from Task 2
- Produces: focused `sellerProductCode` editor with `aria-invalid` and `aria-describedby`

- [ ] **Step 1: Add grouped duplicate state and focus request state**

```tsx
import {
  // existing imports
  duplicateCodeGroups,
} from "./lib/products";

const productCodeInputRef = useRef<HTMLInputElement>(null);
const [productCodeFocusRequest, setProductCodeFocusRequest] = useState<{ id: string; nonce: number } | null>(null);

const duplicateProductCodeGroups = useMemo(() => duplicateCodeGroups(products), [products]);
const duplicateProductCodeIds = useMemo(
  () => new Set(duplicateProductCodeGroups.flatMap((group) => group.productIds)),
  [duplicateProductCodeGroups],
);
const editingHasDuplicateCode = editing ? duplicateProductCodeIds.has(editing.id) : false;
```

- [ ] **Step 2: Connect a fix request to the editor and field focus**

```tsx
function fixDuplicateCode(id: string) {
  setEditingId(id);
  setTab("edit");
  setProductCodeFocusRequest({ id, nonce: Date.now() });
}

useEffect(() => {
  if (!editingId || productCodeFocusRequest?.id !== editingId) return;
  const frame = window.requestAnimationFrame(() => {
    productCodeInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    productCodeInputRef.current?.focus({ preventScroll: true });
  });
  return () => window.cancelAnimationFrame(frame);
}, [editingId, productCodeFocusRequest]);
```

The timestamp is only an event nonce created by a user click; it is not rendered, so it cannot create an SSR hydration mismatch.

- [ ] **Step 3: Pass the fix callback to ProductList**

```tsx
<ProductList
  products={products}
  selectedIds={selectedIds}
  editingId={editingId}
  onSelect={setSelectedIds}
  onEdit={setEditingId}
  onFixDuplicate={fixDuplicateCode}
  onCreate={createProduct}
  onDuplicate={duplicate}
  onDelete={remove}
  onImport={importExcel}
  busy={importing}
/>
```

- [ ] **Step 4: Render the editable product code field before the existing form fields**

```tsx
<div className="formGrid">
  <label className={editingHasDuplicateCode ? "fieldError" : ""}>
    <span>판매자 상품코드</span>
    <input
      ref={productCodeInputRef}
      value={String(editing.data.sellerProductCode ?? "")}
      onChange={(event) => updateProductData({ sellerProductCode: event.target.value })}
      aria-invalid={editingHasDuplicateCode || undefined}
      aria-describedby={editingHasDuplicateCode ? "seller-product-code-error" : undefined}
    />
    {editingHasDuplicateCode && (
      <small id="seller-product-code-error" className="fieldErrorMessage">
        다른 상품과 중복된 코드입니다. 고유한 코드로 수정해 주세요.
      </small>
    )}
  </label>
  {fields.map((field) => (
    <label key={field.key} className={field.key === "feature" ? "wide" : ""}>
      <span>{field.label}</span>
      {field.key === "feature" ? (
        <textarea value={product[field.key]} onChange={(event) => updateField(field.key, event.target.value)} />
      ) : (
        <input value={product[field.key]} onChange={(event) => updateField(field.key, event.target.value)} />
      )}
    </label>
  ))}
</div>
```

- [ ] **Step 5: Add field error styles**

```css
.formGrid label.fieldError input{border-color:#d5614e;background:#fff8f6;box-shadow:0 0 0 3px #f7ddd8}
.fieldErrorMessage{display:block;margin-top:6px;color:#a43d30;font-size:10px;font-weight:700}
```

- [ ] **Step 6: Verify the complete user flow in the browser**

1. Create or import two products with code `PE-YE-2` and two with `PE-YE-4`.
2. Confirm the warning lists both codes and all four affected product names.
3. Confirm all affected rows have the duplicate error style and `코드중복` badge.
4. Click one `수정하기` button and confirm its editor opens with focus on `판매자 상품코드`.
5. Confirm the input exposes `aria-invalid="true"` and the linked error text.
6. Change the selected code to a unique value and confirm that product leaves the affected list immediately.
7. Resolve the final duplicate and confirm the warning disappears.

- [ ] **Step 7: Run final verification**

Run: `npm.cmd test`

Expected: all tests pass.

Run: `npm.cmd run lint`

Expected: 0 errors; the existing seven warnings may remain.

Run: `npm.cmd run build`

Expected: production build succeeds.

Run: `git diff --check`

Expected: exit code 0.

- [ ] **Step 8: Commit only if the implementation files are safely isolatable**

```powershell
git add -- app/lib/products.ts tests/duplicate-product-codes.test.ts app/components/ProductList.tsx app/page.tsx app/globals.css
git commit -m "feat: guide duplicate product code fixes"
```

If these untracked or modified files still contain unrelated user work, leave the implementation uncommitted and report that explicitly.
