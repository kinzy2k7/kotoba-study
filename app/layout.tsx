import type { Metadata } from "next";
import "./globals.css";
import "./study/style.css";
import "./login/login.css";

export const metadata: Metadata = {
  title: "Kotoba · Góc học tiếng Nhật",
  description: "Một chút tiếng Nhật mỗi ngày. Từ vựng, ngữ pháp, Kanji và gia sư AI dành cho N5–N4.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
