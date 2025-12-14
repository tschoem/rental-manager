import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { prisma } from "@/lib/prisma";
import { getActiveTemplate, getTemplateStylesPath } from "@/lib/templates";
import TemplateLoader from "./_components/TemplateLoader";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await prisma.siteSettings.findFirst();

    return {
      title: settings?.siteName || "Rental Manager",
      description: settings?.seoDescription || "Manage your properties and bookings",
      keywords: settings?.seoKeywords ? settings.seoKeywords.split(',').map(k => k.trim()).filter(k => k) : undefined,
      authors: settings?.seoAuthor ? [{ name: settings.seoAuthor }] : undefined,
      icons: {
        icon: '/icon',
      },
      openGraph: {
        title: settings?.siteName || "Rental Manager",
        description: settings?.seoDescription || "Manage your properties and bookings",
        url: settings?.siteUrl || undefined,
        siteName: settings?.siteName || "Rental Manager",
      },
    };
  } catch (error) {
    return {
      title: "Rental Manager",
      description: "Manage your properties and bookings",
      icons: {
        icon: '/icon',
      },
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const activeTemplate = await getActiveTemplate();
  const templateStylesPath = getTemplateStylesPath(activeTemplate);

  return (
    <html lang="en">
      <head>
        {/* Preload the template stylesheet to prevent FOUC */}
        <link
          rel="preload"
          href={templateStylesPath}
          as="style"
        />
        {/* Blocking stylesheet - must load before render */}
        <link
          rel="stylesheet"
          href={templateStylesPath}
          data-template-stylesheet="true"
        />
      </head>
      <body suppressHydrationWarning>
        {/* Blocking script - injects CSS immediately to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
                            (function() {
                                var href = '${templateStylesPath}';
                                var existing = document.querySelector('link[data-template-stylesheet][href="' + href + '"]');
                                if (!existing) {
                                    var link = document.createElement('link');
                                    link.rel = 'stylesheet';
                                    link.href = href;
                                    link.setAttribute('data-template-stylesheet', 'true');
                                    link.setAttribute('media', 'all');
                                    var head = document.head || document.getElementsByTagName('head')[0];
                                    head.insertBefore(link, head.firstChild);
                                }
                            })();
                        `,
          }}
        />
        <TemplateLoader templateId={activeTemplate} />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
