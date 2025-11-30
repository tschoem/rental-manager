import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import HomePageEditor from "./_components/HomePageEditor";

export const dynamic = 'force-dynamic';

// Get or create home page settings
async function getOrCreateHomePageSettings() {
  let settings = await prisma.homePageSettings.findFirst({
    include: {
      heroImages: {
        orderBy: { order: 'asc' }
      },
      features: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!settings) {
    settings = await prisma.homePageSettings.create({
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
      },
      include: {
        heroImages: true,
        features: true
      }
    });

    const settingsId = settings.id;

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

    // Reload with features and hero images
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
      settings = reloadedSettings;
    }
  }

  return settings;
}

export default async function HomePageAdmin() {
  await requireAuth("/admin/home");

  const settings = await getOrCreateHomePageSettings();

  return (
    <div className="admin-content">
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/admin" style={{ color: 'var(--muted)' }}>← Back to Dashboard</Link>
      </div>

      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Home Page Editor</h1>

      <HomePageEditor settings={settings} />
    </div>
  );
}

