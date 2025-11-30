'use client';

import SortableOwnersList from './SortableOwnersList';

interface OwnerImage {
    id: string;
    url: string;
    isProfile: boolean;
}

interface Owner {
    id: string;
    name: string;
    bio: string | null;
    profileImage: string | null;
    order: number;
    facebookUrl: string | null;
    instagramUrl: string | null;
    twitterUrl: string | null;
    linkedinUrl: string | null;
    airbnbUrl: string | null;
    websiteUrl: string | null;
    images: OwnerImage[];
}

interface OwnersListProps {
    owners: Owner[];
}

export default function OwnersList({ owners }: OwnersListProps) {
    return <SortableOwnersList owners={owners} />;
}

