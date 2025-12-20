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

  // Get site settings for custom code
  let customHeadCode: string | null = null;
  let customBodyCode: string | null = null;
  try {
    const settings = await prisma.siteSettings.findFirst();
    customHeadCode = settings?.customHeadCode || null;
    customBodyCode = settings?.customBodyCode || null;
  } catch (error) {
    // If database is not available, continue without custom code
    console.error('Error fetching site settings:', error);
  }

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
        {/* Custom head code - injected via script that runs immediately (only on non-admin routes) */}
        {customHeadCode && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  // Don't inject custom code on admin routes
                  if (window.location.pathname.startsWith('/admin')) {
                    return;
                  }
                  var code = ${JSON.stringify(customHeadCode)};
                  var tempDiv = document.createElement('div');
                  tempDiv.innerHTML = code;
                  var nodes = Array.from(tempDiv.childNodes);
                  nodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                      document.head.appendChild(node.cloneNode(true));
                    } else if (node.nodeType === 8) { // Comment node
                      document.head.appendChild(node.cloneNode(true));
                    }
                  });
                })();
              `,
            }}
          />
        )}
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
        {/* Custom body code - injected via script after React hydration (only on non-admin routes) */}
        {customBodyCode && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  // Don't inject custom code on admin routes
                  if (window.location.pathname.startsWith('/admin')) {
                    return;
                  }
                  // Wait for React to finish hydrating before injecting custom code
                  function injectCode() {
                    var code = ${JSON.stringify(customBodyCode)};
                    var tempDiv = document.createElement('div');
                    tempDiv.innerHTML = code;
                    var nodes = Array.from(tempDiv.childNodes);
                    nodes.forEach(function(node) {
                      if (node.nodeType === 1) { // Element node
                        var cloned = node.cloneNode(true);
                        document.body.appendChild(cloned);
                        // Execute scripts
                        if (cloned.tagName === 'SCRIPT') {
                          var script = document.createElement('script');
                          if (cloned.src) {
                            script.src = cloned.src;
                          } else {
                            script.textContent = cloned.textContent;
                          }
                          Array.from(cloned.attributes).forEach(function(attr) {
                            script.setAttribute(attr.name, attr.value);
                          });
                          document.body.appendChild(script);
                          document.body.removeChild(cloned);
                        }
                      } else if (node.nodeType === 8) { // Comment node
                        document.body.appendChild(node.cloneNode(true));
                      }
                    });
                  }
                  
                  function waitForHydration() {
                    // Wait for DOM to be ready
                    if (document.readyState === 'loading') {
                      document.addEventListener('DOMContentLoaded', function() {
                        setTimeout(waitForHydration, 1000);
                      });
                      return;
                    }
                    // Wait for React hydration - use requestIdleCallback if available
                    if (window.requestIdleCallback) {
                      window.requestIdleCallback(function() {
                        setTimeout(injectCode, 200);
                      }, { timeout: 2000 });
                    } else {
                      // Fallback: wait for load event + additional delay
                      if (document.readyState === 'complete') {
                        setTimeout(injectCode, 1000);
                      } else {
                        window.addEventListener('load', function() {
                          setTimeout(injectCode, 1000);
                        });
                      }
                    }
                  }
                  waitForHydration();
                })();
              `,
            }}
          />
        )}
        <TemplateLoader templateId={activeTemplate} />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
