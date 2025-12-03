'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" style={{
      marginBottom: '2rem',
      fontSize: '0.875rem'
    }}>
      <ol style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        listStyle: 'none',
        padding: 0,
        margin: 0,
        flexWrap: 'wrap'
      }}>
        {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center' }}>
            {index > 0 && (
              <span style={{
                margin: '0 0.5rem',
                color: 'var(--muted)'
              }}>
                /
              </span>
            )}
            {index === items.length - 1 ? (
              <span style={{
                color: 'var(--foreground)',
                fontWeight: 500
              }}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                style={{
                  color: 'var(--muted)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--muted)';
                }}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

