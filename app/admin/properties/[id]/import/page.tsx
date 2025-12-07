import { prisma } from "@/lib/prisma";
import ImportForm from "./_components/ImportForm";
import Link from "next/link";

export default async function ImportRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, name: true }
  });

  if (!property) {
    return <div>Property not found</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href={`/admin/properties/${property.id}`} style={{ color: 'var(--muted)' }}>← Back to Property</Link>
        <h1 style={{ fontSize: '2rem' }}>Import Room from Airbnb</h1>
      </div>

      <ImportForm propertyId={property.id} propertyName={property.name} />
    </div>
  );
}
