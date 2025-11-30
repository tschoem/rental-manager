'use client';

export default function DragHandle() {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                cursor: 'grab',
                padding: '0.5rem',
                color: '#999',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div style={{ display: 'flex', gap: '3px' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />
            </div>
        </div>
    );
}

