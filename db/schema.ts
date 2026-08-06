import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * 상품 템플릿 — "빠른 명령"(예: "사과 39900원에 올려줘")이 찾아 쓰는 재사용 상품 정보.
 * 원산지·품종·상세설명·사진처럼 잘 안 바뀌는 사실은 여기 저장해두고,
 * 명령어에서 가격·재고만 다시 지정하면 그 값으로 덮어써서 등록한다.
 *
 * 브라우저 localStorage(상품 목록)와 달리 서버 D1에 저장되므로 다른 기기·직원과 공유된다.
 */
export const productTemplates = sqliteTable("product_templates", {
  id: text("id").primaryKey(),
  /** 명령어에서 찾는 이름. 예: "사과" */
  name: text("name").notNull(),
  /** 콤마로 구분한 별칭. 예: "부사,홍로,사과박스" */
  aliases: text("aliases").notNull().default(""),
  /** CanonicalRow(공통 상품 스키마) 전체를 JSON 문자열로 저장 */
  data: text("data").notNull(),
  /** 사진 URL 배열 JSON */
  images: text("images").notNull().default("[]"),
  /** 사진별 표지/상세 역할 태그 JSON */
  imageRoles: text("image_roles").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * 카페24 OAuth 토큰 — 이 앱은 한 사람(한 쇼핑몰)만 쓰므로 행 하나(id="default")만 둔다.
 * access_token은 2시간마다 만료되므로 refresh_token으로 계속 갱신해서 이 표에 다시 저장한다.
 */
export const cafe24Tokens = sqliteTable("cafe24_tokens", {
  id: text("id").primaryKey().default("default"),
  mallId: text("mall_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  /** ISO 문자열. 이 시각이 지나면 access_token을 다시 발급받아야 한다 */
  expiresAt: text("expires_at").notNull(),
  scopes: text("scopes").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
