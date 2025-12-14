'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { requestBooking } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface BookingFormProps {
  roomId: string;
  roomPrice: number | null;
  initialStartDate?: string;
  initialEndDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
}

export default function BookingForm({ roomId, roomPrice, initialStartDate = '', initialEndDate = '', onStartDateChange, onEndDateChange }: BookingFormProps) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  // Update local state when props change
  useEffect(() => {
    setStartDate(initialStartDate);
  }, [initialStartDate]);

  useEffect(() => {
    setEndDate(initialEndDate);
  }, [initialEndDate]);

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    onStartDateChange?.(date);
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    onEndDateChange?.(date);
  };
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const calculateNights = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotal = () => {
    if (!roomPrice) return null;
    const nights = calculateNights();
    return nights * roomPrice;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!startDate || !endDate || !name || !email) {
      alert('Please fill in all fields');
      return;
    }

    const formData = new FormData();
    formData.append('roomId', roomId);
    formData.append('name', name);
    formData.append('email', email);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('message', message);

    startTransition(async () => {
      try {
        await requestBooking(formData);
        setSubmitted(true);
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } catch (error) {
        alert('Failed to submit booking request. Please try again.');
      }
    });
  };

  if (submitted) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: '#dcfce7',
        borderRadius: 'var(--card-radius, 12px)',
        color: '#16a34a'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✓</div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Request Sent!</h3>
        <p style={{ fontSize: '1rem' }}>We'll contact you shortly to confirm your booking.</p>
      </div>
    );
  }

  const nights = calculateNights();
  const total = calculateTotal();

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 500,
            fontSize: '1rem'
          }}>
            Check-in
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 500,
            fontSize: '1rem'
          }}>
            Check-out
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            min={startDate || new Date().toISOString().split('T')[0]}
            required
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 500,
            fontSize: '1rem'
          }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 500,
            fontSize: '1rem'
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 500,
            fontSize: '1rem'
          }}>
            Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Any special requests or questions?"
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      {/* Price Summary */}
      {nights > 0 && roomPrice && (
        <div style={{
          padding: '1.25rem',
          background: 'var(--surface)',
          borderRadius: 'var(--card-radius, 12px)',
          marginBottom: '1.5rem',
          fontSize: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <span>€{roomPrice} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
            <span>€{total?.toFixed(2)}</span>
          </div>
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '0.5rem',
            marginTop: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 600,
            fontSize: '1.125rem'
          }}>
            <span>Total</span>
            <span>€{total?.toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '1.125rem',
          fontSize: '1.125rem',
          fontWeight: 600,
          cursor: isPending ? 'wait' : 'pointer'
        }}
      >
        {isPending ? 'Sending...' : 'Request to Book'}
      </button>

      <p style={{
        fontSize: '0.875rem',
        color: 'var(--muted)',
        textAlign: 'center',
        marginTop: '1rem'
      }}>
        This is a booking request. We'll confirm availability and contact you shortly.
      </p>
    </form>
  );
}

