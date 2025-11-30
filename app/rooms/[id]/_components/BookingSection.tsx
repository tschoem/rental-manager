'use client';

import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import CalendarView from './CalendarView';
import BookingForm from './BookingForm';

interface BookingSectionProps {
    roomId: string;
    roomPrice: number | null;
    showCalendar: boolean;
}

export interface BookingFormRef {
    setCheckIn: (date: string) => void;
    setCheckOut: (date: string) => void;
    getCheckIn: () => string;
}

const BookingFormWithRef = forwardRef<BookingFormRef, { roomId: string; roomPrice: number | null }>(
    ({ roomId, roomPrice }, ref) => {
        const [startDate, setStartDate] = useState('');
        const [endDate, setEndDate] = useState('');

        useImperativeHandle(ref, () => ({
            setCheckIn: (date: string) => setStartDate(date),
            setCheckOut: (date: string) => setEndDate(date),
            getCheckIn: () => startDate,
        }));

        return <BookingForm roomId={roomId} roomPrice={roomPrice} initialStartDate={startDate} initialEndDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />;
    }
);

BookingFormWithRef.displayName = 'BookingFormWithRef';

export default function BookingSection({ roomId, roomPrice, showCalendar }: BookingSectionProps) {
    const bookingFormRef = useRef<BookingFormRef>(null);

    const handleDateClick = (date: Date) => {
        if (!bookingFormRef.current) return;

        const dateString = date.toISOString().split('T')[0];
        const currentCheckIn = bookingFormRef.current.getCheckIn?.() || '';

        // If no check-in is set, or clicked date is before current check-in, set check-in
        if (!currentCheckIn || dateString < currentCheckIn) {
            bookingFormRef.current.setCheckIn(dateString);
            bookingFormRef.current.setCheckOut('');
        } 
        // If check-in is set and clicked date is after check-in, set check-out
        else if (dateString > currentCheckIn) {
            bookingFormRef.current.setCheckOut(dateString);
        }
        // If clicking the same date as check-in, clear check-in
        else {
            bookingFormRef.current.setCheckIn('');
            bookingFormRef.current.setCheckOut('');
        }
    };

    return (
        <>
            {showCalendar && <CalendarView roomId={roomId} onDateClick={handleDateClick} />}
            <BookingFormWithRef ref={bookingFormRef} roomId={roomId} roomPrice={roomPrice} />
        </>
    );
}

