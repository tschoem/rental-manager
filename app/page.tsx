import Link from "next/link";
import Header from "./_components/Header";
import RotatingHero from "./_components/RotatingHero";
import Footer from "./_components/Footer";
import SetupPage from "./_components/SetupPage";
import { Prisma } from "../generated/client/client";
import { getSetupStatus } from "@/lib/setup-status";

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  try {
    // Check setup status first - if database is not configured or no admin user exists, show setup page
    const setupStatus = await getSetupStatus();
    if (!setupStatus.databaseInitialized.configured || !setupStatus.databaseUrl.configured) {
      return <SetupPage setupStatus={setupStatus} />;
    }
    
    // If database is configured but no admin user exists, show setup page
    if (!setupStatus.adminUserExists.configured) {
      return <SetupPage setupStatus={setupStatus} />;
    }

    // Check if all required setup steps are complete
    const requiredSetupComplete = 
      setupStatus.databaseUrl.configured &&
      setupStatus.databaseInitialized.configured &&
      setupStatus.nextAuthSecret.configured &&
      setupStatus.adminUserExists.configured;
    
    // If required setup is complete, only show setup page if explicitly requested via query param
    // (for optional configs like SMTP)
    const params = await searchParams;
    const explicitlyRequestSetup = params?.setup === 'true' || params?.setup === '';
    
    // If required setup is complete and user didn't explicitly request setup, show home page
    if (requiredSetupComplete && !explicitlyRequestSetup) {
      // Continue to show home page below
    } else if (explicitlyRequestSetup) {
      // User explicitly requested setup page (for optional configs)
      return <SetupPage setupStatus={setupStatus} />;
    }

    // Only import and use prisma AFTER confirming database is initialized
    // This prevents SQLite from creating an empty database file
    const { prisma } = await import("@/lib/prisma");
    const settings = await prisma.siteSettings.findFirst();
    const singlePropertyMode = settings?.singlePropertyMode ?? false;

    // Get or create home page settings (same logic as admin page)
    let homePageSettings = await prisma.homePageSettings.findFirst({
      include: {
        heroImages: {
          orderBy: { order: 'asc' }
        },
        features: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // If no settings exist, create them with defaults (including default hero image)
    if (!homePageSettings) {
      const newSettings = await prisma.homePageSettings.create({
        data: {
          heroTitle: "Welcome to Rental Manager",
          heroSubtitle: "An Open Source project to host your Airbnb Rooms and Properties yourself",
          heroCtaText: "Explore Features",
          showHeroSection: true,
          featuresTitle: "Rental Manager Features",
          showFeaturesSection: true,
          aboutTitle: "Build a Dedicated website for all your Airbnb Properties",
          aboutDescription: "Re-take ownership of your properties and rooms by building a dedicated site very easily. Simply add your properties and rooms by scanning the Airbnb links. The site will scan the Airbnb listings for images, amenities and descriptions and let you manage your Property details easily via a simple CMS.",
          showAboutSection: true,
          roomsTitle: "Rooms & Properties",
          roomsSubtitle: "This section will display all your properties or rooms (for single-property sites)",
          showRoomsSection: true,
          ctaTitle: "Enjoy more Hosting Freedom",
          ctaDescription: "With Rental Manager, take direct bookings easily.",
          showCtaSection: true
        }
      });

      const settingsId = newSettings.id;

      // Create default hero image
      await prisma.homePageImage.create({
        data: {
          url: '/hero-rentalmanager.png',
          order: 0,
          homePageSettingsId: settingsId
        }
      });

      // Create default features
      const defaultFeatures = [
        { icon: '🏠', title: 'Import your Properties', description: 'Import all your rooms and properties from Airbnb.', order: 0 },
        { icon: '📆', title: 'Calendar Sync', description: 'Synchronize Calendars with Airbnb calendar to show real-time availability.', order: 1 },
        { icon: '🗒️', title: 'Simple CMS', description: 'Customize Home page, Location page and About page via built-in Content Management System.', order: 2 },
        { icon: '📧', title: 'Booking requests', description: 'All your booking requests are sent over by email for you to handle the customer bookings directly.', order: 3 }
      ];

      await prisma.homePageFeature.createMany({
        data: defaultFeatures.map(f => ({
          ...f,
          homePageSettingsId: settingsId
        }))
      });

      // Reload with hero images and features
      const reloadedSettings = await prisma.homePageSettings.findFirst({
        where: { id: settingsId },
        include: {
          heroImages: {
            orderBy: { order: 'asc' }
          },
          features: {
            orderBy: { order: 'asc' }
          }
        }
      });

      if (reloadedSettings) {
        homePageSettings = reloadedSettings;
      }
    }

    const properties = await prisma.property.findMany({
      include: {
        images: true,
        rooms: {
          where: { unlisted: false },
          include: { images: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    // If single property mode, get rooms from the first property (or all rooms)
    let rooms: any[] = [];
    if (singlePropertyMode) {
      // Ideally we'd have a 'main property' setting, but for now we'll take the first one
      const mainProperty = properties[0];
      if (mainProperty) {
        rooms = mainProperty.rooms;
      }
    }

    // Check if SMTP is not configured - show banner
    const showSmtpBanner = !setupStatus.smtp.configured;

    return (
    <div>
      {/* Header */}
      <Header />
      
      {/* SMTP Configuration Banner */}
      {showSmtpBanner && (
        <div style={{
          background: '#fff3cd',
          borderBottom: '2px solid #ffc107',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div className="container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <strong style={{ color: '#856404' }}>⚠️ SMTP not configured</strong>
              <span style={{ color: '#856404', marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                Email functionality (password reset, booking notifications) will not work.
              </span>
            </div>
            <Link 
              href="/?setup=true"
              style={{
                padding: '0.5rem 1rem',
                background: '#667eea',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '0.9rem'
              }}
            >
              Configure SMTP
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <RotatingHero 
        singlePropertyMode={singlePropertyMode}
        heroImages={homePageSettings?.heroImages.map(img => img.url) || []}
        heroTitle={homePageSettings?.heroTitle || "Your Home away from home"}
        heroSubtitle={homePageSettings?.heroSubtitle || "Enjoy Family hospitality - close to town, airport and beach"}
        heroCtaText={homePageSettings?.heroCtaText || (singlePropertyMode ? "Explore Rooms" : "Explore Properties")}
      />

      {/* Features Section */}
      {homePageSettings?.showFeaturesSection !== false && homePageSettings?.features && homePageSettings.features.length > 0 && (
        <section className="section" style={{ background: 'var(--off-white)' }}>
          <div className="container">
            {homePageSettings.featuresTitle && (
              <div className="section-header">
                <h2 className="section-title">{homePageSettings.featuresTitle}</h2>
              </div>
            )}
            <div className="features-grid">
              {homePageSettings.features.map((feature) => (
                <div key={feature.id} className="feature-card">
                  <div className="feature-icon">{feature.icon || '📌'}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {homePageSettings?.showAboutSection !== false && (homePageSettings?.aboutTitle || homePageSettings?.aboutDescription) && (
        <section className="section">
          <div className="container text-center">
            {homePageSettings.aboutTitle && (
              <h2 className="section-title">{homePageSettings.aboutTitle}</h2>
            )}
            {homePageSettings.aboutDescription && (
              <p className="section-subtitle">
                {homePageSettings.aboutDescription}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Properties Section */}
      {homePageSettings?.showRoomsSection !== false && (
        <section className="section" id="properties" style={{ background: 'var(--off-white)' }}>
        <div className="container">
          <div className="section-header">
            {homePageSettings?.roomsTitle && (
              <h2 className="section-title">{homePageSettings.roomsTitle}</h2>
            )}
            {homePageSettings?.roomsSubtitle && (
              <p className="section-subtitle">
                {homePageSettings.roomsSubtitle}
              </p>
            )}
          </div>

          {singlePropertyMode ? (
            // Single Property Mode: Show Rooms directly
            rooms.length === 0 ? (
              <p className="text-center text-muted">No rooms listed yet. Check back soon!</p>
            ) : (
              <div className="rooms-grid">
                {rooms.map((room: any) => (
                  <div key={room.id} className="room-card">
                    <img
                      src={
                        room.images[0]?.url ||
                        (properties.find(p => p.id === room.propertyId)?.images[0]?.url) ||
                        '/placeholder-beach.jpg'
                      }
                      alt={room.name}
                      className="room-image"
                    />
                    <div className="room-content">
                      <h3>{room.name}</h3>
                      <p className="rooms-count">{room.description?.substring(0, 100)}...</p>
                      <p className="location" style={{ fontWeight: 'bold', color: 'var(--ocean-blue)' }}>
                        {room.price ? `€${room.price} / night` : 'Contact for pricing'}
                      </p>
                      <Link href={`/rooms/${room.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Multi-Property Mode: Show Properties
            properties.length === 0 ? (
              <p className="text-center text-muted">No properties listed yet. Check back soon!</p>
            ) : (
              <div className="rooms-grid">
                {properties.map((property: any) => (
                  <div key={property.id} className="room-card">
                    <img
                      src={property.rooms[0]?.images[0]?.url || '/placeholder-beach.jpg'}
                      alt={property.name}
                      className="room-image"
                    />
                    <div className="room-content">
                      <h3>{property.name}</h3>
                      <p className="location">{property.address}</p>
                      <p className="rooms-count">{property.rooms.length} {property.rooms.length === 1 ? 'Room' : 'Rooms'} Available</p>
                      <Link href={`/properties/${property.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                        Check Availability
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </section>
      )}

      {/* CTA Section */}
      {homePageSettings?.showCtaSection !== false && (homePageSettings?.ctaTitle || homePageSettings?.ctaDescription) && (
        <section className="section">
          <div className="container text-center">
            {homePageSettings.ctaTitle && (
              <h2 className="section-title">{homePageSettings.ctaTitle}</h2>
            )}
            {homePageSettings.ctaDescription && (
              <p className="section-subtitle">
                {homePageSettings.ctaDescription}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
  } catch (error) {
    // Check if it's a database initialization error
    if (error instanceof Prisma.PrismaClientInitializationError || 
        (error instanceof Error && (
          error.message.includes('DATABASE_URL') || 
          error.message.includes('datasource') ||
          error.message.includes('You must provide a nonempty URL')
        ))) {
      // Get setup status to show what's configured
      const setupStatus = await getSetupStatus();
      return <SetupPage setupStatus={setupStatus} />;
    }
    // Re-throw other errors
    throw error;
  }
}
