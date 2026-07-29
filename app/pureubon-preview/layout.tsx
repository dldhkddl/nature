import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "자연섬김 푸르본 | 산지직송 농산물",
  description:
    "산지에서 정성껏 선별한 농산물을 소개하는 자연섬김 푸르본 미리보기입니다.",
};

export default function PureubonPreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
