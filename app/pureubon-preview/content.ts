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
  {
    label: "대량구매 문의",
    description: "수량별 견적 상담",
    href: "#customer-center",
  },
  {
    label: "주문조회",
    description: "배송 진행 확인",
    href: "#customer-center",
  },
  {
    label: "배송안내",
    description: "출고·배송 정책",
    href: "#shipping-guide",
  },
  {
    label: "고객센터",
    description: "운영시간 안내",
    href: "#customer-center",
  },
];

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
  product(
    "apple-3kg",
    "산지직송 햇사과 3kg",
    "아삭한 식감과 풍부한 과즙",
    "/samples/apple-main.png",
    "인기",
  ),
  product(
    "pear-5kg",
    "프리미엄 신고배 5kg",
    "선물용으로 정성껏 선별",
    "/samples/pear-main.png",
    "추천",
  ),
  product(
    "apple-gift",
    "사과 선물세트",
    "고른 빛깔의 실속 구성",
    "/samples/apple-cut.png",
  ),
  product(
    "season-box",
    "제철 과일 혼합상자",
    "계절의 맛을 한 상자에",
    "/samples/pear-main.png",
    "제철",
  ),
  product(
    "apple-family",
    "가정용 실속 사과",
    "매일 즐기는 산지 과일",
    "/samples/apple-main.png",
  ),
  product(
    "pear-family",
    "가정용 실속 배",
    "달고 시원한 제철 배",
    "/samples/pear-main.png",
  ),
  product(
    "apple-premium",
    "프리미엄 사과 특선",
    "선별과 포장에 정성을 더한 구성",
    "/samples/apple-cut.png",
    "특선",
  ),
  product(
    "fruit-bulk",
    "사업자용 과일 대량구매",
    "수량별 맞춤 상담 상품",
    "/samples/apple-main.png",
    "대량구매",
  ),
];

export const dealProducts: ProductPreview[] = [
  product(
    "deal-apple",
    "이번 주 사과 특가",
    "산지 물량 한정 구성",
    "/samples/apple-main.png",
    "특가",
  ),
  product(
    "deal-pear",
    "이번 주 배 특가",
    "신선 출고 한정 수량",
    "/samples/pear-main.png",
    "특가",
  ),
  product(
    "deal-gift",
    "제철 선물상자",
    "감사의 마음을 담은 포장",
    "/samples/apple-cut.png",
    "제철",
  ),
  product(
    "deal-bulk",
    "농산물 대량구매 기획",
    "사업자 회원 전용 상담",
    "/samples/pear-main.png",
    "기획",
  ),
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
