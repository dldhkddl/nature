import assert from "node:assert/strict";
import test from "node:test";
import * as products from "../app/lib/products.ts";
import type { ImageRole } from "../app/lib/products.ts";

type ImageState = {
  images: string[];
  imageRoles?: Partial<Record<string, ImageRole>>;
};

const addProductImages = (products as typeof products & {
  addProductImages?: (state: ImageState, sources: string[], maxImages?: number) => ImageState;
}).addProductImages;
const productDetailImages = (products as typeof products & {
  productDetailImages?: (state: ImageState) => string[];
}).productDetailImages;
const toggleProductImageRole = (products as typeof products & {
  toggleProductImageRole?: (state: ImageState, src: string, role: ImageRole) => ImageState;
}).toggleProductImageRole;
const moveProductImage = (products as typeof products & {
  moveProductImage?: (state: ImageState, fromIndex: number, toIndex: number) => ImageState;
}).moveProductImage;

test("puts newly uploaded images first and makes the first one the cover", () => {
  assert.equal(typeof addProductImages, "function");
  assert.deepEqual(
    addProductImages?.(
      {
        images: ["old-cover.jpg", "old-detail.jpg"],
        imageRoles: { "old-cover.jpg": "cover", "old-detail.jpg": "detail" },
      },
      ["new-first.jpg", "new-second.jpg"],
    ),
    {
      images: ["new-first.jpg", "new-second.jpg", "old-cover.jpg", "old-detail.jpg"],
      imageRoles: { "new-first.jpg": "cover", "old-detail.jpg": "detail" },
    },
  );
});

test("keeps the current image state when no upload slot remains", () => {
  assert.equal(typeof addProductImages, "function");
  const full = Array.from({ length: 10 }, (_, index) => `old-${index}.jpg`);
  assert.deepEqual(
    addProductImages?.({ images: full, imageRoles: { "old-0.jpg": "cover" } }, ["new.jpg"]),
    { images: full, imageRoles: { "old-0.jpg": "cover" } },
  );
});

test("orders every selected detail image after the cover", () => {
  assert.deepEqual(
    products.orderedImages({
      images: ["plain.jpg", "detail-1.jpg", "cover.jpg", "detail-2.jpg"],
      imageRoles: {
        "cover.jpg": "cover",
        "detail-1.jpg": "detail",
        "detail-2.jpg": "detail",
      },
    }),
    ["cover.jpg", "detail-1.jpg", "detail-2.jpg", "plain.jpg"],
  );
});

test("returns all selected detail images and keeps the legacy second-image fallback", () => {
  assert.equal(typeof productDetailImages, "function");
  assert.deepEqual(
    productDetailImages?.({
      images: ["cover.jpg", "detail-1.jpg", "plain.jpg", "detail-2.jpg"],
      imageRoles: {
        "cover.jpg": "cover",
        "detail-1.jpg": "detail",
        "detail-2.jpg": "detail",
      },
    }),
    ["detail-1.jpg", "detail-2.jpg"],
  );
  assert.deepEqual(
    productDetailImages?.({ images: ["legacy-cover.jpg", "legacy-detail.jpg", "plain.jpg"] }),
    ["legacy-detail.jpg"],
  );
});

test("toggles detail images independently while keeping cover selection exclusive", () => {
  assert.equal(typeof toggleProductImageRole, "function");
  const initial: ImageState = {
    images: ["cover.jpg", "detail-1.jpg", "detail-2.jpg"],
    imageRoles: { "cover.jpg": "cover", "detail-1.jpg": "detail" },
  };
  const withTwoDetails = toggleProductImageRole?.(initial, "detail-2.jpg", "detail");
  assert.deepEqual(withTwoDetails?.imageRoles, {
    "cover.jpg": "cover",
    "detail-1.jpg": "detail",
    "detail-2.jpg": "detail",
  });
  assert.deepEqual(toggleProductImageRole?.(withTwoDetails!, "detail-1.jpg", "detail").imageRoles, {
    "cover.jpg": "cover",
    "detail-2.jpg": "detail",
  });
  assert.deepEqual(toggleProductImageRole?.(withTwoDetails!, "detail-2.jpg", "cover").imageRoles, {
    "detail-1.jpg": "detail",
    "detail-2.jpg": "cover",
  });
});

test("keeps the legacy second detail selected when adding another detail", () => {
  assert.equal(typeof toggleProductImageRole, "function");
  assert.deepEqual(
    toggleProductImageRole?.(
      {
        images: ["cover.jpg", "legacy-detail.jpg", "new-detail.jpg"],
        imageRoles: { "cover.jpg": "cover" },
      },
      "new-detail.jpg",
      "detail",
    ).imageRoles,
    {
      "cover.jpg": "cover",
      "legacy-detail.jpg": "detail",
      "new-detail.jpg": "detail",
    },
  );
});

test("moves an image without losing its assigned roles", () => {
  assert.equal(typeof moveProductImage, "function");
  assert.deepEqual(
    moveProductImage?.(
      {
        images: ["cover.jpg", "detail-1.jpg", "detail-2.jpg"],
        imageRoles: { "cover.jpg": "cover", "detail-1.jpg": "detail", "detail-2.jpg": "detail" },
      },
      2,
      0,
    ),
    {
      images: ["detail-2.jpg", "cover.jpg", "detail-1.jpg"],
      imageRoles: { "cover.jpg": "cover", "detail-1.jpg": "detail", "detail-2.jpg": "detail" },
    },
  );
});
