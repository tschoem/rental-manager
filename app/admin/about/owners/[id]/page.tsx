import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import OwnerForm from "../_components/OwnerForm";

export const dynamic = 'force-dynamic';

export default async function EditOwnerPage({ params }: { params: Promise<{ id: string }> }) {
    if (!authOptions) {
        redirect("/");
    }
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/auth/signin?callbackUrl=/admin/about");
    }

    const { id } = await params;
    const owner = await prisma.owner.findUnique({
        where: { id },
        include: {
            images: true
        }
    });

    if (!owner) {
        notFound();
    }

    return (
        <div className="admin-content">
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin/about" style={{ color: 'var(--muted)' }}>← Back to About Page</Link>
            </div>

            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Edit Owner: {owner.name}</h1>

            <OwnerForm owner={owner} />
        </div>
    );
}

