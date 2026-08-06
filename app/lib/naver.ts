import bcrypt from "bcryptjs";

const TOKEN_URL = "https://api.commerce.naver.com/external/v1/oauth2/token";
const IMAGE_UPLOAD_URL = "https://api.commerce.naver.com/external/v1/product-images/upload";
const PRODUCT_URL = "https://api.commerce.naver.com/external/v2/products";

export type NaverCredentials = { clientId: string; clientSecret: string };
export type NaverApiStage = "인증" | "이미지 업로드" | "상품 정보 전송";

export class NaverApiError extends Error {
  status: number;
  detail: unknown;
  stage: NaverApiStage;
  constructor(message: string, status: number, detail: unknown, stage: NaverApiStage) {
    super(message);
    this.status = status;
    this.detail = detail;
    this.stage = stage;
  }
}

const NAVER_API_STAGES: NaverApiStage[] = ["인증", "이미지 업로드", "상품 정보 전송"];

export function isNaverApiError(error: unknown): error is NaverApiError {
  if (!error || typeof error !== "object") return false;

  const candidate = error as Partial<NaverApiError>;
  return (
    typeof candidate.message === "string" &&
    typeof candidate.status === "number" &&
    NAVER_API_STAGES.includes(candidate.stage as NaverApiStage)
  );
}

/**
 * 네이버 커머스 API 전자서명 생성.
 * signature = base64( bcrypt(`${clientId}_${timestamp}`, clientSecret) )
 * clientSecret 자체가 bcrypt salt 형식(`$2a$...`)으로 발급됩니다.
 */
function buildSignature(clientId: string, clientSecret: string, timestamp: string) {
  const password = `${clientId}_${timestamp}`;
  const hashed = bcrypt.hashSync(password, clientSecret);
  return Buffer.from(hashed, "utf-8").toString("base64");
}

export async function getAccessToken({ clientId, clientSecret }: NaverCredentials) {
  const timestamp = Date.now().toString();
  const signature = buildSignature(clientId, clientSecret, timestamp);

  const body = new URLSearchParams({
    client_id: clientId,
    timestamp,
    client_secret_sign: signature,
    grant_type: "client_credentials",
    type: "SELF",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; message?: string; [k: string]: unknown }
    | null;

  if (!res.ok || !data?.access_token) {
    throw new NaverApiError(
      (data as { message?: string } | null)?.message || "네이버 인증에 실패했습니다. Client ID/Secret을 확인해 주세요.",
      res.status,
      data,
      "인증",
    );
  }

  return { accessToken: data.access_token, expiresIn: data.expires_in ?? 10800 };
}

export async function uploadProductImage(accessToken: string, file: File) {
  const form = new FormData();
  form.append("imageFiles", file, file.name || "image.jpg");

  const res = await fetch(IMAGE_UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  const data = (await res.json().catch(() => null)) as
    | { images?: { url: string }[]; message?: string }
    | null;

  if (!res.ok || !data?.images?.length) {
    throw new NaverApiError(
      (data as { message?: string } | null)?.message || "상품 이미지 업로드에 실패했습니다.",
      res.status,
      data,
      "이미지 업로드",
    );
  }

  return data.images[0].url;
}

export type RegisterProductInput = {
  accessToken: string;
  leafCategoryId: string;
  name: string;
  sellerProductCode: string;
  salePrice: number;
  stockQuantity: number;
  representativeImageUrl: string;
  optionalImageUrls: string[];
  detailContentHtml: string;
  originAreaContent: string;
  originAreaCode: string;
  afterServiceTelephoneNumber: string;
  afterServiceGuideContent: string;
  weight: string;
  producer: string;
  storage: string;
  deliveryCompany: string;
  returnDeliveryFee: number;
  exchangeDeliveryFee: number;
  greenCertificationId: string;
  greenCertificationName: string;
  greenCertificationNumber: string;
  unitPriceYn: boolean;
  totalCapacityValue: number;
  unitCapacity: number;
  indicationUnit: string;
};

export function buildNaverProductPayload(input: Omit<RegisterProductInput, "accessToken">) {
  const detailReference = "상품 상세 참조";
  const productWeight = input.weight || detailReference;
  const producer = input.producer || detailReference;
  const storage = input.storage || detailReference;
  const greenCertificationId = input.greenCertificationId?.trim() || "EXCLUDED";
  const hasGreenCertification = greenCertificationId !== "EXCLUDED";

  return {
    originProduct: {
      statusType: "SALE",
      saleType: "NEW",
      leafCategoryId: input.leafCategoryId,
      name: input.name.slice(0, 100),
      detailContent: input.detailContentHtml,
      images: {
        representativeImage: { url: input.representativeImageUrl },
        optionalImages: input.optionalImageUrls.map((url) => ({ url })),
      },
      salePrice: input.salePrice,
      stockQuantity: input.stockQuantity,
      deliveryInfo: {
        deliveryType: "DELIVERY",
        deliveryAttributeType: "NORMAL",
        deliveryCompany: input.deliveryCompany,
        deliveryFee: { deliveryFeeType: "FREE" },
        claimDeliveryInfo: {
          returnDeliveryFee: input.returnDeliveryFee,
          exchangeDeliveryFee: input.exchangeDeliveryFee,
        },
      },
      detailAttribute: {
        minorPurchasable: true,
        unitCapacity: input.unitPriceYn
          ? {
              unitPriceYn: true,
              totalCapacityValue: input.totalCapacityValue,
              unitCapacity: input.unitCapacity,
              indicationUnit: input.indicationUnit,
            }
          : { unitPriceYn: false },
        ...(hasGreenCertification
          ? {
              productCertificationInfos: [{
                certificationInfoId: Number(greenCertificationId),
                certificationKindType: "GREEN_PRODUCTS",
                name: input.greenCertificationName,
                certificationNumber: input.greenCertificationNumber,
                certificationMark: true,
              }],
            }
          : {}),
        certificationTargetExcludeContent: {
          greenCertifiedProductExclusionYn: !hasGreenCertification,
        },
        afterServiceInfo: {
          afterServiceTelephoneNumber: input.afterServiceTelephoneNumber,
          afterServiceGuideContent: input.afterServiceGuideContent,
        },
        originAreaInfo: {
          originAreaCode: input.originAreaCode,
          content: input.originAreaContent,
        },
        productInfoProvidedNotice: {
          productInfoProvidedNoticeType: "FOOD",
          food: {
            returnCostReason: "1",
            noRefundReason: "1",
            qualityAssuranceStandard: "1",
            compensationProcedure: "1",
            troubleShootingContents: "1",
            foodItem: input.name,
            weight: productWeight,
            amount: productWeight,
            size: productWeight,
            packDateText: detailReference,
            consumptionDateText: detailReference,
            producer,
            productComposition: productWeight,
            keep: storage,
            adCaution: detailReference,
            customerServicePhoneNumber: input.afterServiceTelephoneNumber,
          },
        },
        sellerCodeInfo: { sellerManagementCode: input.sellerProductCode },
      },
    },
    smartstoreChannelProduct: {
      naverShoppingRegistration: true,
      channelProductDisplayStatusType: "ON",
    },
  };
}

export async function registerProduct(input: RegisterProductInput) {
  const payload = buildNaverProductPayload(input);

  let res: Response;
  try {
    res = await fetch(PRODUCT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (isNaverApiError(error)) throw error;
    throw new NaverApiError(
      error instanceof Error ? error.message : "네이버 상품 등록 서버에 연결하지 못했습니다.",
      502,
      null,
      "상품 정보 전송",
    );
  }

  const data = (await res.json().catch(() => null)) as
    | { productNo?: string | number; originProductNo?: string | number; message?: string; invalidInputs?: unknown }
    | null;

  if (!res.ok) {
    throw new NaverApiError(
      (data as { message?: string } | null)?.message || "네이버 상품 등록에 실패했습니다.",
      res.status,
      data,
      "상품 정보 전송",
    );
  }

  return data;
}
