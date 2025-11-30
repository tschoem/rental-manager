'use client';

import { SetupStatus } from '@/lib/setup-status';
import AdminSetupForm from './AdminSetupForm';

interface SetupPageProps {
  setupStatus: SetupStatus;
}

export default function SetupPage({ setupStatus }: SetupPageProps) {
  const { databaseUrl, nextAuthSecret, nextAuthUrl, databaseInitialized, adminUserExists, smtp } = setupStatus;
  
  // Determine which steps are completed
  const steps = {
    envFile: true, // Assume .env file exists if we're checking these
    databaseUrl: databaseUrl.configured,
    databaseInit: databaseUrl.configured && databaseInitialized.configured,
    nextAuthSecret: nextAuthSecret.configured,
    nextAuthUrl: nextAuthUrl.configured,
    adminUser: adminUserExists.configured,
    smtp: smtp.configured,
  };

  // Count completed steps (excluding optional nextAuthUrl)
  const requiredSteps = {
    envFile: steps.envFile,
    databaseUrl: steps.databaseUrl,
    databaseInit: steps.databaseInit,
    nextAuthSecret: steps.nextAuthSecret,
    adminUser: steps.adminUser,
  };
  const completedCount = Object.values(requiredSteps).filter(Boolean).length;
  const totalSteps = Object.keys(requiredSteps).length;
  const progress = (completedCount / totalSteps) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '3rem',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem'
          }}>🚀</div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1a202c',
            marginBottom: '0.5rem'
          }}>
            Setup Required
          </h1>
          <p style={{
            color: '#718096',
            fontSize: '1.1rem',
            marginBottom: '1rem'
          }}>
            {completedCount === totalSteps && adminUserExists.configured
              ? 'Almost there! Just restart your server to complete setup.'
              : `Complete the remaining setup steps (${completedCount}/${totalSteps} done)`
            }
          </p>
          
          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e2e8f0',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        <div style={{
          background: '#f7fafc',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '1rem'
          }}>
            Setup Steps:
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' }}>
            {/* Step 1: DATABASE_URL */}
            <div style={{
              padding: '1rem',
              background: steps.databaseUrl ? '#d4edda' : 'white',
              border: `2px solid ${steps.databaseUrl ? '#28a745' : '#e2e8f0'}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              overflow: 'hidden'
            }}>
              <div style={{
                fontSize: '1.5rem',
                minWidth: '2rem',
                textAlign: 'center',
                flexShrink: 0
              }}>
                {steps.databaseUrl ? '✅' : '1️⃣'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: steps.databaseUrl ? '#155724' : '#2d3748', wordBreak: 'break-word' }}>
                  {steps.databaseUrl ? 'DATABASE_URL configured' : 'Configure DATABASE_URL'}
                </div>
                {!steps.databaseUrl && (
                  <div style={{ fontSize: '0.9rem', color: '#4a5568', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    Add <code style={{
                      background: '#e2e8f0',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '3px',
                      fontSize: '0.85em'
                    }}>DATABASE_URL="file:./dev.db"</code> to your <code style={{
                      background: '#e2e8f0',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '3px',
                      fontSize: '0.85em'
                    }}>.env</code> file.
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      background: '#fff3cd', 
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      color: '#856404'
                    }}>
                      <strong>Note:</strong> The setup script will automatically convert this to an absolute path to ensure the database is created in the correct location.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Database Initialization */}
            {steps.databaseUrl && (
              <div style={{
                padding: '1rem',
                background: steps.databaseInit ? '#d4edda' : 'white',
                border: `2px solid ${steps.databaseInit ? '#28a745' : '#e2e8f0'}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  minWidth: '2rem',
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  {steps.databaseInit ? '✅' : '2️⃣'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: steps.databaseInit ? '#155724' : '#2d3748' }}>
                    {steps.databaseInit ? 'Database initialized' : 'Initialize the database'}
                  </div>
                  {!steps.databaseInit && (
                    <div style={{ fontSize: '0.9rem', color: '#4a5568', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {databaseInitialized.message ? (
                        <div>
                          <div style={{ 
                            marginBottom: '0.5rem', 
                            color: '#dc3545', 
                            fontWeight: '500',
                            whiteSpace: 'pre-line',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            overflow: 'hidden'
                          }}>
                            {databaseInitialized.message}
                          </div>
                          {databaseInitialized.message.includes('file:') && (
                            <div style={{ 
                              marginTop: '0.5rem', 
                              padding: '0.75rem', 
                              background: '#f8f9fa', 
                              borderRadius: '4px',
                              fontSize: '0.85rem'
                            }}>
                              <strong>Quick fix:</strong> Make sure your <code style={{
                                background: '#e2e8f0',
                                padding: '0.1rem 0.3rem',
                                borderRadius: '3px',
                                fontSize: '0.85em'
                              }}>.env</code> file contains:
                              <pre style={{
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                background: '#e9ecef',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                overflow: 'auto'
                              }}>
                                DATABASE_URL="file:./dev.db"
                              </pre>
                              Or if you want it in the prisma folder:
                              <pre style={{
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                background: '#e9ecef',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                overflow: 'auto'
                              }}>
                                DATABASE_URL="file:./prisma/dev.db"
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          Run <code style={{
                            background: '#e2e8f0',
                            padding: '0.1rem 0.3rem',
                            borderRadius: '3px',
                            fontSize: '0.85em'
                          }}>npm run setup</code> to create the database schema
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: NEXTAUTH_SECRET */}
            <div style={{
              padding: '1rem',
              background: steps.nextAuthSecret ? '#d4edda' : 'white',
              border: `2px solid ${steps.nextAuthSecret ? '#28a745' : '#e2e8f0'}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              overflow: 'hidden'
            }}>
              <div style={{
                fontSize: '1.5rem',
                minWidth: '2rem',
                textAlign: 'center',
                flexShrink: 0
              }}>
                {steps.nextAuthSecret ? '✅' : steps.databaseUrl ? '3️⃣' : '2️⃣'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: steps.nextAuthSecret ? '#155724' : '#2d3748', wordBreak: 'break-word' }}>
                  {steps.nextAuthSecret ? 'NEXTAUTH_SECRET configured' : 'Configure NEXTAUTH_SECRET'}
                </div>
                {!steps.nextAuthSecret && (
                  <div style={{ fontSize: '0.9rem', color: '#4a5568', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    Add <code style={{
                      background: '#e2e8f0',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '3px',
                      fontSize: '0.85em'
                    }}>NEXTAUTH_SECRET="your-secret-key-here"</code> to your <code style={{
                      background: '#e2e8f0',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '3px',
                      fontSize: '0.85em'
                    }}>.env</code> file. Generate a secure secret with: <code style={{
                      background: '#e2e8f0',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '3px',
                      fontSize: '0.85em'
                    }}>openssl rand -base64 32</code>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: NEXTAUTH_URL (optional but recommended) */}
            <div style={{
              padding: '1rem',
              background: steps.nextAuthUrl ? '#d4edda' : '#fff3cd',
              border: `2px solid ${steps.nextAuthUrl ? '#28a745' : '#ffc107'}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              overflow: 'hidden'
            }}>
              <div style={{
                fontSize: '1.5rem',
                minWidth: '2rem',
                textAlign: 'center',
                flexShrink: 0
              }}>
                {steps.nextAuthUrl ? '✅' : 'ℹ️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: steps.nextAuthUrl ? '#155724' : '#856404', wordBreak: 'break-word' }}>
                  {steps.nextAuthUrl ? 'NEXTAUTH_URL configured' : 'NEXTAUTH_URL (optional)'}
                </div>
                {!steps.nextAuthUrl && (
                  <div style={{ fontSize: '0.9rem', color: '#856404', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    For production, add <code style={{
                      background: '#fff3cd',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '3px',
                      fontSize: '0.85em'
                    }}>NEXTAUTH_URL="https://yourdomain.com"</code>. For development, this is auto-detected.
                  </div>
                )}
              </div>
            </div>

            {/* Step 5: Admin User */}
            {steps.databaseInit && steps.nextAuthSecret && (
              <div style={{
                padding: '1rem',
                background: steps.adminUser ? '#d4edda' : 'white',
                border: `2px solid ${steps.adminUser ? '#28a745' : '#e2e8f0'}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  minWidth: '2rem',
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  {steps.adminUser ? '✅' : '5️⃣'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: steps.adminUser ? '#155724' : '#2d3748', wordBreak: 'break-word' }}>
                    {steps.adminUser ? 'Admin user created' : 'Create admin user'}
                  </div>
                  {!steps.adminUser && (
                    <div style={{ fontSize: '0.9rem', color: '#4a5568', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      Create the first admin user to access the admin panel. Use the form below.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: SMTP Configuration (optional but recommended) */}
            {steps.databaseInit && steps.nextAuthSecret && (
              <div style={{
                padding: '1rem',
                background: steps.smtp ? '#d4edda' : '#fff3cd',
                border: `2px solid ${steps.smtp ? '#28a745' : '#ffc107'}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  minWidth: '2rem',
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  {steps.smtp ? '✅' : '6️⃣'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: steps.smtp ? '#155724' : '#856404', wordBreak: 'break-word' }}>
                    {steps.smtp ? 'SMTP configured' : 'Configure SMTP (optional)'}
                  </div>
                  {!steps.smtp && (
                    <div style={{ fontSize: '0.9rem', color: '#856404', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {smtp.message || 'SMTP is required for email functionality (password reset, booking notifications).'}
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fff', borderRadius: '4px', fontSize: '0.85rem' }}>
                        Add to your <code style={{
                          background: '#fff3cd',
                          padding: '0.1rem 0.3rem',
                          borderRadius: '3px',
                          fontSize: '0.85em'
                        }}>.env</code> file:
                        <pre style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          background: '#f7f7f7',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          overflow: 'auto'
                        }}>
{`SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM_EMAIL="your-email@gmail.com"`}
                        </pre>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                          <strong>Note:</strong> For Gmail, you'll need to use an App Password, not your regular password.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Final Step: Restart */}
            {steps.databaseUrl && steps.databaseInit && steps.nextAuthSecret && adminUserExists.configured && (
              <div style={{
                padding: '1rem',
                background: '#d1ecf1',
                border: '2px solid #17a2b8',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  minWidth: '2rem',
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  🔄
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#0c5460', wordBreak: 'break-word' }}>
                    Restart your development server
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#0c5460', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    Stop your server (Ctrl+C) and run <code style={{
                      background: '#bee5eb',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '3px',
                      fontSize: '0.85em'
                    }}>npm run dev</code> again to apply all changes.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Admin Setup Form - Show when database is ready but no admin exists */}
        {steps.databaseUrl && steps.databaseInit && steps.nextAuthSecret && !adminUserExists.configured && (
          <div style={{
            background: '#fff3cd',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '2px solid #ffc107'
          }}>
            <AdminSetupForm />
          </div>
        )}

        {(steps.databaseUrl || !steps.databaseInit) && (
          <div style={{
            background: '#edf2f7',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <p style={{
              fontSize: '0.9rem',
              color: '#4a5568',
              margin: 0,
              lineHeight: '1.6'
            }}>
              <strong>Note:</strong> If you're using a different database (PostgreSQL, MySQL, etc.), 
              make sure to set the appropriate <code style={{
                background: '#cbd5e0',
                padding: '0.1rem 0.3rem',
                borderRadius: '3px',
                fontSize: '0.85em'
              }}>DATABASE_URL</code> in your <code style={{
                background: '#cbd5e0',
                padding: '0.1rem 0.3rem',
                borderRadius: '3px',
                fontSize: '0.85em'
              }}>.env</code> file.
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => {
              // If all required steps are complete, redirect to home page (without query param)
              // Otherwise, reload the page
              const requiredStepsComplete = 
                databaseUrl.configured &&
                databaseInitialized.configured &&
                nextAuthSecret.configured &&
                adminUserExists.configured;
              
              if (requiredStepsComplete) {
                window.location.href = '/';
              } else {
                window.location.reload();
              }
            }}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#5568d3'}
            onMouseOut={(e) => e.currentTarget.style.background = '#667eea'}
          >
            {completedCount === totalSteps && adminUserExists.configured ? 'Go to Home Page' : 'Reload Page'}
          </button>
        </div>
      </div>
    </div>
  );
}

