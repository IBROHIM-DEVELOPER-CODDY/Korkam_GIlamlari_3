import "./globals.css";

export const metadata = {
  title: "Korkam Gilamlari — Kassa",
  description: "Korkam Gilamlari uchun hisob-kitob (kassa) paneli",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
