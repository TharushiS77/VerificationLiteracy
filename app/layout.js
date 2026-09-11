import "./globals.css";

export const metadata = {
  title: "Review Gym — practice catching what AI gets wrong",
  description:
    "A verification-literacy training tool. The AI writes a flawed draft; you diagnose it, fix it, and get graded on your judgment.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
