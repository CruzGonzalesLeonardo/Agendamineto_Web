import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agendamiento ciudadano",
  description: "Orientación y reserva de citas para trámites públicos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
