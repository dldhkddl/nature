/**
 * 쿠팡 Open API
 *
 * 쿠팡은 상품명을 보내면 카테고리를 추천해 주는 API가 있다.
 * 과거 등록 상품으로 학습한 모델이라, 사람이 카테고리 트리를 뒤지는 것보다 빠르고 정확하다.
 *
 * 인증: HMAC-SHA256 서명을 Authorization 헤더에 담는다 (CEA 방식).
 *   message   = signedDate + method + path + query
 *   signature = hex( HMAC-SHA256(message, secretKey) )
 */

const HOST = "https://api-gateway.coupang.com";
const PREDICT_PATH = "/v2/providers/openapi/apis/api/v1/categorization/predict";

export class CoupangApiError extends Error {
  status: number;
  detail: unknown;
  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

/** yyMMdd'T'HHmmss'Z' (UTC) */
function signedDate(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    String(now.getUTCFullYear()).slice(2) +
    p(now.getUTCMonth() + 1) +
    p(now.getUTCDate()) +
    "T" +
    p(now.getUTCHours()) +
    p(now.getUTCMinutes()) +
    p(now.getUTCSeconds()) +
    "Z"
  );
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

export async function buildAuthorization(
  accessKey: string,
  secretKey: string,
  method: string,
  path: string,
  query = "",
): Promise<string> {
  const date = signedDate();
  const signature = await hmacSha256Hex(secretKey, date + method + path + query);
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${date}, signature=${signature}`;
}

export type CoupangCredentials = { accessKey: string; secretKey: string };

export type PredictedCategory = {
  ok: boolean;
  categoryId?: string;
  categoryName?: string;
  /** 쿠팡이 판단하지 못한 경우의 사유 */
  reason?: string;
};

/**
 * 상품명으로 쿠팡 카테고리를 추천받는다.
 *
 * 상품명이 검색 키워드 나열식("사과 부사 선물 과일 산지직송")이면 정확도가 떨어진다.
 * 쿠팡 문서도 사람이 봐도 알기 어려운 이름은 모델도 못 맞힌다고 안내한다.
 */
export async function predictCategory(
  { accessKey, secretKey }: CoupangCredentials,
  input: { productName: string; brand?: string; attributes?: Record<string, string> },
): Promise<PredictedCategory> {
  const authorization = await buildAuthorization(accessKey, secretKey, "POST", PREDICT_PATH);

  const res = await fetch(`${HOST}${PREDICT_PATH}`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json;charset=UTF-8" },
    body: JSON.stringify({
      productName: input.productName,
      ...(input.brand ? { brand: input.brand } : {}),
      ...(input.attributes ? { attributes: input.attributes } : {}),
    }),
  });

  const data = (await res.json().catch(() => null)) as {
    code?: string | number;
    message?: string;
    data?: {
      autoCategorizationPredictionResultType?: string;
      predictedCategoryId?: string | number;
      predictedCategoryName?: string;
      comment?: string;
    };
  } | null;

  if (!res.ok) {
    throw new CoupangApiError(
      data?.message || "쿠팡 카테고리 추천에 실패했습니다. ACCESS KEY / SECRET KEY를 확인해 주세요.",
      res.status,
      data,
    );
  }

  const result = data?.data;
  if (result?.autoCategorizationPredictionResultType !== "SUCCESS" || !result?.predictedCategoryId) {
    return { ok: false, reason: result?.comment || data?.message || "쿠팡이 카테고리를 판단하지 못했습니다." };
  }

  return {
    ok: true,
    categoryId: String(result.predictedCategoryId),
    categoryName: result.predictedCategoryName ?? "",
  };
}
