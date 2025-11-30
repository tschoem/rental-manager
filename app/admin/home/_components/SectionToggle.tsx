'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface SectionToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => Promise<void>;
}

export default function SectionToggle({ label, checked, onChange }: SectionToggleProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.checked;
        startTransition(async () => {
            try {
                await onChange(newValue);
                router.refresh();
            } catch (error) {
                alert('Failed to update section visibility');
            }
        });
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={handleToggle}
                    disabled={isPending}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 500 }}>Show {label} Section</span>
            </label>
        </div>
    );
}

