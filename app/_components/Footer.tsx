export default function Footer() {
    return (
        <footer style={{
            background: 'var(--text-dark)',
            color: 'white',
            padding: 'var(--spacing-xl) 0',
            textAlign: 'center'
        }}>
            <div className="container">
                <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                    © 2025 - Powered by{' '}
                    <a 
                        href="https://github.com/tschoem/rental-manager" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                            color: 'white', 
                            textDecoration: 'underline',
                            fontWeight: 500
                        }}
                    >
                        Rental Manager
                    </a>
                    {' '}- an open source project -{' '}
                    <a 
                        href="https://github.com/tschoem/rental-manager" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                            color: 'white', 
                            textDecoration: 'underline',
                            fontWeight: 500
                        }}
                    >
                        find out more on GitHub
                    </a>
                </p>
            </div>
        </footer>
    );
}

