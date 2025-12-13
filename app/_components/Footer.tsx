import { prisma } from "@/lib/prisma";

export default async function Footer() {
    const settings = await prisma.siteSettings.findFirst();
    const currentYear = new Date().getFullYear();
    
    return (
        <footer style={{
            background: 'var(--text-dark)',
            color: 'white',
            padding: 'var(--spacing-xl) 0',
            textAlign: 'center'
        }}>
            <div className="container">
                {settings?.footerText ? (
                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                        <p style={{ marginBottom: settings?.footerShowPoweredBy ? 'var(--spacing-sm)' : '0' }}>
                            {settings.footerText}
                        </p>
                        {settings.footerShowPoweredBy && (
                            <p style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: 'var(--spacing-sm)' }}>
                                © {currentYear} - Powered by{' '}
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
                                {' '}- an open source project
                            </p>
                        )}
                    </div>
                ) : (
                    <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                        © {currentYear} - Powered by{' '}
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
                )}
            </div>
        </footer>
    );
}

