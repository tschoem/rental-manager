'use client'

import { createRoom, updateRoom, addRoomImage, deleteRoomImage, deleteRoomImages, moveRoomImagesToProperty, updateRoomAmenities } from "@/app/admin/rooms/actions";
import { useState, useTransition } from "react";
import ShowAirbnbLinkToggle from "./ShowAirbnbLinkToggle";
import ShowCalendarToggle from "./ShowCalendarToggle";

interface RoomFormProps {
    propertyId: string;
    room?: {
        id: string;
        name: string;
        description: string | null;
        price: number | null;
        capacity: number | null;
        airbnbUrl: string | null;
        showAirbnbLink: boolean;
        iCalUrl: string | null;
        showCalendar: boolean;
        amenities: string | null;
        unlisted: boolean;
        images: { id: string; url: string }[];
    };
}

export default function RoomForm({ propertyId, room }: RoomFormProps) {
    const action = room
        ? updateRoom.bind(null, room.id)
        : createRoom;

    const [amenitiesList, setAmenitiesList] = useState<string[]>(
        room?.amenities ? JSON.parse(room.amenities) : []
    );
    const [newAmenity, setNewAmenity] = useState("");
    const [bulkAmenitiesText, setBulkAmenitiesText] = useState("");
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState("");
    const [savingAmenities, setSavingAmenities] = useState(false);
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();
    const [airbnbUrl, setAirbnbUrl] = useState(room?.airbnbUrl || '');

    const handleAddAmenity = () => {
        if (newAmenity.trim()) {
            const updated = [...amenitiesList, newAmenity.trim()];
            setAmenitiesList(updated);
            setNewAmenity("");

            if (room) {
                setSavingAmenities(true);
                updateRoomAmenities(room.id, updated).finally(() => setSavingAmenities(false));
            }
        }
    };

    const handleRemoveAmenity = (index: number) => {
        const updated = amenitiesList.filter((_, i) => i !== index);
        setAmenitiesList(updated);

        if (room) {
            setSavingAmenities(true);
            updateRoomAmenities(room.id, updated).finally(() => setSavingAmenities(false));
        }
    };

    const handleBulkImport = () => {
        if (!bulkAmenitiesText.trim()) return;

        // Split by newlines, trim whitespace, filter empty lines, and remove duplicates
        const newAmenities = bulkAmenitiesText
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .filter((amenity, index, self) => self.indexOf(amenity) === index); // Remove duplicates

        // Merge with existing amenities, avoiding duplicates
        const existingSet = new Set(amenitiesList);
        const uniqueNewAmenities = newAmenities.filter(amenity => !existingSet.has(amenity));
        const updated = [...amenitiesList, ...uniqueNewAmenities];

        setAmenitiesList(updated);
        setBulkAmenitiesText("");
        setShowBulkImport(false);

        if (room) {
            setSavingAmenities(true);
            updateRoomAmenities(room.id, updated).finally(() => setSavingAmenities(false));
        }
    };

    const handleAddImage = async () => {
        if (newImageUrl.trim() && room) {
            await addRoomImage(room.id, newImageUrl.trim());
            setNewImageUrl("");
        }
    };

    const handleDeleteImage = async (imageId: string) => {
        if (room && confirm("Are you sure you want to delete this image?")) {
            await deleteRoomImage(imageId, room.id);
        }
    };

    const handleToggleImageSelection = (imageId: string) => {
        setSelectedImages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(imageId)) {
                newSet.delete(imageId);
            } else {
                newSet.add(imageId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (room) {
            if (selectedImages.size === room.images.length) {
                setSelectedImages(new Set());
            } else {
                setSelectedImages(new Set(room.images.map(img => img.id)));
            }
        }
    };

    const handleBulkDelete = () => {
        if (room && selectedImages.size > 0) {
            if (confirm(`Are you sure you want to delete ${selectedImages.size} image(s)?`)) {
                startTransition(async () => {
                    await deleteRoomImages(Array.from(selectedImages), room.id);
                    setSelectedImages(new Set());
                });
            }
        }
    };

    const handleBulkMoveToProperty = () => {
        if (room && selectedImages.size > 0) {
            if (confirm(`Move ${selectedImages.size} image(s) to property level?`)) {
                startTransition(async () => {
                    await moveRoomImagesToProperty(Array.from(selectedImages), room.id);
                    setSelectedImages(new Set());
                });
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Basic Info Form */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Basic Information</h2>

                <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {!room && <input type="hidden" name="propertyId" value={propertyId} />}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="name" style={{ fontWeight: 500 }}>Room Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            defaultValue={room?.name}
                            required
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="description" style={{ fontWeight: 500 }}>
                            Description / About this space
                            {room?.description && (
                                <span style={{ fontSize: '0.875rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>
                                    ({room.description.length} characters)
                                </span>
                            )}
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            defaultValue={room?.description || ''}
                            rows={12}
                            placeholder="Full description of the space, including details about the property, amenities, location, and what guests can expect..."
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', fontFamily: 'inherit', lineHeight: 1.6 }}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            This is the "About this space" section that will be displayed to guests
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label htmlFor="price" style={{ fontWeight: 500 }}>Price per Night (€)</label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                step="0.01"
                                defaultValue={room?.price || ''}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label htmlFor="capacity" style={{ fontWeight: 500 }}>Capacity (guests)</label>
                            <input
                                type="number"
                                id="capacity"
                                name="capacity"
                                defaultValue={room?.capacity || ''}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="airbnbUrl" style={{ fontWeight: 500 }}>Airbnb URL (Optional)</label>
                        <input
                            type="url"
                            id="airbnbUrl"
                            name="airbnbUrl"
                            value={airbnbUrl}
                            onChange={(e) => setAirbnbUrl(e.target.value)}
                            placeholder="https://www.airbnb.com/rooms/..."
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    {room && airbnbUrl && (
                        <ShowAirbnbLinkToggle 
                            roomId={room.id} 
                            initialShowAirbnbLink={room.showAirbnbLink} 
                            airbnbUrl={airbnbUrl}
                        />
                    )}


                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="iCalUrl" style={{ fontWeight: 500 }}>iCal Calendar URL (Optional)</label>
                        <input
                            type="url"
                            id="iCalUrl"
                            name="iCalUrl"
                            defaultValue={room?.iCalUrl || ''}
                            placeholder="https://www.airbnb.com/calendar/ical/..."
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            For automatic availability syncing with Airbnb
                        </p>
                    </div>

                    {room && (
                        <ShowCalendarToggle 
                            roomId={room.id} 
                            initialShowCalendar={room.showCalendar} 
                        />
                    )}

                    <button type="submit" className="btn btn-primary">
                        {room ? 'Update Room' : 'Create Room'}
                    </button>
                </form>
            </div>

            {/* Images Section - Only for existing rooms */}
            {room && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Images</h2>
                        {room.images.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={handleSelectAll}
                                    className="btn btn-outline"
                                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                >
                                    {selectedImages.size === room.images.length ? 'Deselect All' : 'Select All'}
                                </button>
                                {selectedImages.size > 0 && (
                                    <>
                                        <button
                                            onClick={handleBulkDelete}
                                            disabled={isPending}
                                            className="btn btn-outline"
                                            style={{ 
                                                fontSize: '0.875rem', 
                                                padding: '0.5rem 1rem',
                                                color: '#c00',
                                                borderColor: '#c00'
                                            }}
                                        >
                                            Delete Selected ({selectedImages.size})
                                        </button>
                                        <button
                                            onClick={handleBulkMoveToProperty}
                                            disabled={isPending}
                                            className="btn btn-outline"
                                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                        >
                                            Move to Property ({selectedImages.size})
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {room.images.length === 0 ? (
                        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>No images added yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            {room.images.map((image) => {
                                const isSelected = selectedImages.has(image.id);
                                return (
                                    <div 
                                        key={image.id} 
                                        style={{ 
                                            position: 'relative', 
                                            borderRadius: '8px', 
                                            overflow: 'hidden', 
                                            border: isSelected ? '3px solid var(--primary)' : '1px solid var(--border)',
                                            cursor: 'pointer',
                                            opacity: isSelected ? 0.9 : 1,
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => handleToggleImageSelection(image.id)}
                                    >
                                        <img src={image.url} alt="Room" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                                        <div style={{
                                            position: 'absolute',
                                            top: '0.5rem',
                                            left: '0.5rem',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '4px',
                                            background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.9)',
                                            border: '2px solid white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '0.875rem'
                                        }}>
                                            {isSelected ? '✓' : ''}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteImage(image.id);
                                            }}
                                            style={{ 
                                                position: 'absolute', 
                                                top: '0.5rem', 
                                                right: '0.5rem', 
                                                background: 'rgba(255,255,255,0.9)', 
                                                border: 'none', 
                                                borderRadius: '4px', 
                                                padding: '0.25rem 0.5rem', 
                                                cursor: 'pointer', 
                                                fontSize: '0.875rem', 
                                                color: '#c00' 
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="url"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="Image URL"
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                        <button onClick={handleAddImage} className="btn btn-outline">
                            Add Image
                        </button>
                    </div>
                </div>
            )}

            {/* Amenities Section */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem' }}>Amenities</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {savingAmenities && <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Saving...</span>}
                        <button
                            onClick={() => setShowBulkImport(!showBulkImport)}
                            className="btn btn-outline"
                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                        >
                            {showBulkImport ? 'Hide' : 'Bulk Import'}
                        </button>
                    </div>
                </div>

                {showBulkImport && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <label htmlFor="bulkAmenities" style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Paste amenities (one per line):
                        </label>
                        <textarea
                            id="bulkAmenities"
                            value={bulkAmenitiesText}
                            onChange={(e) => setBulkAmenitiesText(e.target.value)}
                            placeholder="Bath&#10;Hair dryer&#10;Shampoo&#10;WiFi&#10;Kitchen&#10;..."
                            rows={8}
                            style={{ 
                                width: '100%', 
                                padding: '0.75rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border)', 
                                fontSize: '1rem', 
                                fontFamily: 'inherit',
                                lineHeight: 1.5,
                                marginBottom: '0.5rem'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button onClick={handleBulkImport} className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                                Import {bulkAmenitiesText.split(/\r?\n/).filter(line => line.trim().length > 0).length} amenities
                            </button>
                            <button 
                                onClick={() => {
                                    setBulkAmenitiesText("");
                                    setShowBulkImport(false);
                                }} 
                                className="btn btn-outline"
                                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                            >
                                Cancel
                            </button>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                            Paste a list of amenities separated by line breaks. Duplicates will be automatically removed.
                        </p>
                    </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {amenitiesList.map((amenity, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--surface)', borderRadius: '20px', fontSize: '0.875rem' }}>
                            <span>{amenity}</span>
                            <button
                                onClick={() => handleRemoveAmenity(index)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1rem', lineHeight: 1 }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={newAmenity}
                        onChange={(e) => setNewAmenity(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                        placeholder="Add amenity (e.g., WiFi, Kitchen, Pool)"
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                    />
                    <button onClick={handleAddAmenity} className="btn btn-outline">
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}
