import 'aibos-ui/styles/globals.css';
import './globals.css';

export const metadata = {
  title: 'AIBOS ERP - Core Ledger',
  description: 'Enterprise Resource Planning System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className="dark">
      <body className="min-h-dvh bg-gradient-to-b from-[#0b0c10] to-[#0e1117] text-[#e8e9ed] antialiased">
        {children}
      </body>
    </html>
  );
}
