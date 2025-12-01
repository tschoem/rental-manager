import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import LocationPageEditor from "./_components/LocationPageEditor";
import { getSetupStatus } from "@/lib/setup-status";

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
                mapTitle: "Our Location",
                mapEmbedUrl: null
            }
        });
    }
    
    return settings;
}

export default async function LocationPageAdmin() {
    if (!authOptions) {
        redirect("/");
    }
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/auth/signin?callbackUrl=/admin/location");
    }

    // Check if database is initialized before trying to use it
    const setupStatus = await getSetupStatus();
    if (!setupStatus.databaseInitialized.configured || !setupStatus.databaseUrl.configured) {
        redirect("/?setup=true");
    }

    const settings = await getOrCreateLocationPageSettings();

    return (
        <div className="admin-content">
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin" style={{ color: 'var(--muted)' }}>← Back to Dashboard</Link>
            </div>

            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Location Page Editor</h1>

            <LocationPageEditor settings={settings} />
        </div>
    );
}

