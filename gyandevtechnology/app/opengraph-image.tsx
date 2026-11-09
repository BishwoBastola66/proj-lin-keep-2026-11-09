import { ImageResponse } from 'next/og';

export const alt = 'Gyanav Solutions | Premier IT Consulting & Healthcare Technology Advisory';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '70px 80px',
          background: 'linear-gradient(135deg, #06090e 0%, #0b1329 55%, #132247 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle decorative grid lines */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.08) 2%, transparent 0%)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Header: Brand & Location */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
                color: '#ffffff',
              }}
            >
              G
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: '#ffffff',
                }}
              >
                GYANAV SOLUTIONS
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                }}
              >
                Consulting Services
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '13px',
              fontWeight: 600,
              color: '#38bdf8',
              letterSpacing: '0.06em',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '9999px',
                background: '#38bdf8',
              }}
            />
            VIRGINIA, USA · NATIONWIDE
          </div>
        </div>

        {/* Center: Main Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '1000px',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: '56px',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.035em',
              color: '#ffffff',
            }}
          >
            Premier IT Consulting &amp; Healthcare Technology Advisory.
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 400,
              lineHeight: 1.45,
              color: '#cbd5e1',
            }}
          >
            Strategic cloud modernization, clinical data interoperability (FHIR R4 / HL7), and production-grade engineering for complex enterprise systems.
          </div>
        </div>

        {/* Footer: Core Capability Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            paddingTop: '24px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            {['Enterprise Architecture', 'FHIR & HL7 Data Flow', 'HIPAA Cloud Security', 'Production Engineering'].map(
              (pill) => (
                <div
                  key={pill}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#e2e8f0',
                  }}
                >
                  {pill}
                </div>
              )
            )}
          </div>

          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#94a3b8',
            }}
          >
            gyanavsolutions.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
