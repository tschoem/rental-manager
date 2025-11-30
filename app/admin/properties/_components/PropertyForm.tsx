'use client'

import { createProperty, updateProperty } from "@/app/admin/actions";

interface PropertyFormProps {
    property?: {
        id: string;
        name: string;
        description: string | null;
        address: string | null;
    };
}

export default function PropertyForm({ property }: PropertyFormProps) {
    const action = property
        ? updateProperty.bind(null, property.id)
        : createProperty;

    return (
        <form action={action} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="name" style={{ fontWeight: 500 }}>Property Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    defaultValue={property?.name}
                    required
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="address" style={{ fontWeight: 500 }}>Address</label>
                <input
                    type="text"
                    id="address"
                    name="address"
                    defaultValue={property?.address || ''}
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="description" style={{ fontWeight: 500 }}>Description</label>
                <textarea
                    id="description"
                    name="description"
                    defaultValue={property?.description || ''}
                    rows={5}
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', fontFamily: 'inherit' }}
                />
            </div>

            <button type="submit" className="btn btn-primary">
                {property ? 'Update Property' : 'Create Property'}
            </button>
        </form>
    );
}
