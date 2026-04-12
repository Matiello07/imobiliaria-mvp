import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // CRÍTICO: Define a base para imagens funcionarem no Google/Social
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.matielloimoveis.com.br'),

  title: {
    default: "Matiello Imóveis | Imóveis em Arujá e Região",
    template: "%s | Matiello Imóveis" // Ex: "Casa no Centro | Matiello Imóveis"
  },
  description: "Encontre a casa dos seus sonhos com a Matiello Imóveis. Especialistas em venda e locação de imóveis residenciais e comerciais em Arujá.",
  keywords: ["Imobiliária", "Arujá", "Venda de Imóveis", "Locação", "Casas de Condomínio", "Apartamentos"],

  // Como aparece no WhatsApp/Facebook
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Matiello Imóveis",
    title: "Matiello Imóveis | Seu novo lar começa aqui",
    description: "Confira as melhores oportunidades de imóveis em Arujá e região.",
    // NOTA: 'images' foi removido propositalmente para permitir que o arquivo
    // app/opengraph-image.tsx (ou app/imoveis/[id]/opengraph-image.tsx)
    // seja detectado e usado automaticamente pelo Next.js.
  },

  // Controle explícito para o Google
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>

      <Script
  src="https://www.googletagmanager.com/gtag/js?id=AW-18079208549"
  strategy="afterInteractive"
/>

<Script id="google-tag" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-18079208549');
  `}
</Script>

      <Script id="whatsapp-conversion" strategy="afterInteractive">
    {`
      document.addEventListener('click', function(e) {
        const target = e.target.closest('a');
        if (!target) return;

        const url = target.href;

        if (url.includes('wa.me') || url.includes('api.whatsapp.com')) {
          gtag('event', 'conversion', {
            'send_to': 'AW-18079208549/wkL5CNn6sJocEOWo66xD'
          });
        }
      });
    `}
  </Script>

      <Script id="form-conversion" strategy="afterInteractive">
{`
  document.addEventListener('click', function(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const text = target.innerText.toLowerCase();

    if (text.includes('solicitar agendamento')) {
      gtag('event', 'conversion', {
        'send_to': 'AW-18079208549/2_oHCN2QypocEOWo66xD'
      });
    }
  });
`}
</Script>

        <Script id="form-conversion" strategy="afterInteractive">
{`
  document.addEventListener('click', function(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const text = target.innerText.toLowerCase();

    if (text.includes('enviar mensagem')) {
      gtag('event', 'conversion', {
        'send_to': 'AW-18079208549/hrTuCKu7ypocEOWo66xD'
      });
    }
  });
`}
</Script>
      
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
