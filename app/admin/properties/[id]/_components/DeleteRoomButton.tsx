'use client'

import { deleteRoom } from "@/app/admin/rooms/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteRoomButton({ roomId, roomName }: { roomId: string, roomName: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteRoom(roomId);
            // deleteRoom redirects, so we don't need to do anything here
            // The redirect will happen automatically
        } catch (error: any) {
            // Check if this is a Next.js redirect (not a real error)
            if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
                // This is a redirect, not an error - let it happen
                return;
            }
            // Real error - show alert and reset state
            alert('Failed to delete room. Please try again.');
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn btn-outline"
            style={{
                padding: '0.5rem',
                color: 'var(--destructive)',
                borderColor: 'var(--destructive)',
            }}
        >
            {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
    );
}
