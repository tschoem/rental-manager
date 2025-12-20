import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MobileNav from "./MobileNav";

export default async function Header() {
  const settings = await prisma.siteSettings.findFirst();
  const singlePropertyMode = settings?.singlePropertyMode ?? false;
  const aboutSettings = await prisma.aboutPageSettings.findFirst();
  const showAboutPage = aboutSettings?.showAboutPage ?? false;

  // Get the first property ID if in single property mode
  let propertyId: string | null = null;
  if (singlePropertyMode) {
    const firstProperty = await prisma.property.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    });
    propertyId = firstProperty?.id ?? null;
  }

  const iconType = settings?.siteIconType || 'emoji';
  const showIcon = iconType === 'emoji' ? settings?.siteIcon : settings?.siteIconImageUrl;

  return (
    <header className="site-header">
      <div className="container header-content">
        <Link href="/" className="site-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {showIcon && (
            <span style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: iconType === 'image' ? 'white' : 'transparent',
              padding: iconType === 'image' ? '2px' : '0',
              borderRadius: iconType === 'image' ? '4px' : '0',
              flexShrink: 0
            }}>
              {iconType === 'emoji' ? (
                settings?.siteIcon
              ) : (
                <img 
                  src={settings?.siteIconImageUrl || ''} 
                  alt="Site icon" 
                  style={{ 
                    width: '1.5em', 
                    height: '1.5em', 
                    objectFit: 'contain',
                    display: 'block',
                    margin: 0
                  }}
                />
              )}
            </span>
          )}
          <span>{settings?.siteName || "Rental Manager"}</span>
        </Link>
        <MobileNav
          singlePropertyMode={singlePropertyMode}
          propertyId={propertyId}
          showAboutPage={showAboutPage}
        />
      </div>
    </header>
  );
}
