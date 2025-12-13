import Header from "../_components/Header";
import Footer from "../_components/Footer";
import { getSetupStatus } from "@/lib/setup-status";
import SetupPage from "../_components/SetupPage";

export const dynamic = 'force-dynamic';

// Get or create location page settings
async function getOrCreateLocationPageSettings() {
  // Only import and use prisma AFTER confirming database is initialized
  // This prevents SQLite from creating an empty database file
  const { prisma } = await import("@/lib/prisma");
  let settings = await prisma.locationPageSettings.findFirst();

  if (!settings) {
    settings = await prisma.locationPageSettings.create({
      data: {
        heroImageUrl: "/hero-rentalmanager.png",
        heroTitle: "Explore the Area",
        heroSubtitle: "Discover the unique locations near your properties",
        area1Title: "Area 1",
        area1Subtitle: "Describe the first area near your properties",
        area1Content: "Add content about the first area near your properties. Use double line breaks to separate paragraphs.",
        area1ImageUrl: "/location1.png",
        area2Title: "Area 2",
        area2Subtitle: "Describe the second area near your properties",
        area2Content: "Add content about the second area near your properties. Use double line breaks to separate paragraphs.",
        area2ImageUrl: "/location2.png",
        mapTitle: "Location Map",
        mapEmbedUrl: null
      }
    });
  }

  return settings;
}

export default async function LocationPage() {
  // Check if database is initialized before trying to use it
  const setupStatus = await getSetupStatus();
  if (!setupStatus.databaseInitialized.configured || !setupStatus.databaseUrl.configured) {
    return <SetupPage setupStatus={setupStatus} />;
  }

  const settings = await getOrCreateLocationPageSettings();

  // Split content into paragraphs
  const area1Paragraphs = settings.area1Content?.split('\n\n').filter(p => p.trim()) || [];
  const area2Paragraphs = settings.area2Content?.split('\n\n').filter(p => p.trim()) || [];

  return (
    <div>
      <Header />

      {/* Hero Section */}
      <section
        className="hero"
        style={{
          backgroundImage: `url(${settings.heroImageUrl || '/hero-rentalmanager.png'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '500px'
        }}
      >
        <div className="hero-content">
          <h1>{settings.heroTitle || "Explore the Area"}</h1>
          <p>{settings.heroSubtitle || "Discover the unique locations near your properties"}</p>
        </div>
      </section>

      {/* Area 1 Section */}
      {(settings.area1Title || settings.area1Subtitle || settings.area1Content) && (
        <section className="section">
          <div className="container">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '4rem',
              alignItems: 'center'
            }}>
              <div>
                {settings.area1Title && (
                  <h2 className="section-title" style={{ textAlign: 'center' }}>{settings.area1Title}</h2>
                )}
                {settings.area1Subtitle && (
                  <p className="section-subtitle" style={{ margin: '0 0 1.5rem 0', textAlign: 'center' }}>
                    {settings.area1Subtitle}
                  </p>
                )}
                {area1Paragraphs.map((paragraph, index) => (
                  <p key={index} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                    {paragraph}
                  </p>
                ))}
              </div>
              {settings.area1ImageUrl && (
                <div>
                  <img
                    src={settings.area1ImageUrl}
                    alt={settings.area1Title || "Area 1"}
                    style={{
                      width: '100%',
                      borderRadius: '0',
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Area 2 Section */}
      {(settings.area2Title || settings.area2Subtitle || settings.area2Content) && (
        <section className="section" style={{ background: 'var(--off-white)' }}>
          <div className="container">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '4rem',
              alignItems: 'center',
              direction: 'rtl' // Reverses order visually for alternating layout
            }}>
              <div style={{ direction: 'ltr' }}>
                {settings.area2Title && (
                  <h2 className="section-title" style={{ textAlign: 'center' }}>{settings.area2Title}</h2>
                )}
                {settings.area2Subtitle && (
                  <p className="section-subtitle" style={{ margin: '0 0 1.5rem 0', textAlign: 'center' }}>
                    {settings.area2Subtitle}
                  </p>
                )}
                {area2Paragraphs.map((paragraph, index) => (
                  <p key={index} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                    {paragraph}
                  </p>
                ))}
              </div>
              {settings.area2ImageUrl && (
                <div style={{ direction: 'ltr' }}>
                  <img
                    src={settings.area2ImageUrl}
                    alt={settings.area2Title || "Area 2"}
                    style={{
                      width: '100%',
                      borderRadius: '0',
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Map Section */}
      {settings.mapEmbedUrl && (
        <section className="section">
          <div className="container">
            {settings.mapTitle && (
              <h2 className="section-title text-center">{settings.mapTitle}</h2>
            )}
            <div style={{
              width: '100%',
              height: '450px',
              borderRadius: '0',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              marginTop: '2rem'
            }}>
              <iframe
                src={settings.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
