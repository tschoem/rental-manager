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

  return (
    <header className="site-header">
      <div className="container header-content">
        <Link href="/" className="site-logo">
          {settings?.siteIcon && <span style={{ marginRight: '0.5rem' }}>{settings.siteIcon}</span>}
          {settings?.siteName || "Rental Manager"}
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
