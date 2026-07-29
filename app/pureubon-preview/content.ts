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
