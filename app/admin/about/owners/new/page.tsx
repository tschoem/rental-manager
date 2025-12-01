import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import OwnerForm from "../_components/OwnerForm";

export default async function NewOwnerPage() {
    if (!authOptions) {
        redirect("/");
    }
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/auth/signin?callbackUrl=/admin/about/owners/new");
    }

    return (
        <div className="admin-content">
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin/about" style={{ color: 'var(--muted)' }}>← Back to About Page</Link>
            </div>

            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Add New Owner</h1>

            <OwnerForm />
        </div>
    );
}

