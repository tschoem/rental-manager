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
            // Refresh the page to update the UI
            router.refresh();
        } catch (error) {
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
