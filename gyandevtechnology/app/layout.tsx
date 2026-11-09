import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  title: {
    default: 'Gyanav Solutions | Premier IT Consulting & Healthcare Technology Advisory',
    template: '%s | Gyanav Solutions',
  },
  description:
    'Gyanav Solutions provides strategic enterprise IT consulting, healthcare data interoperability (FHIR R4 / HL7), HIPAA cloud architecture, and custom software engineering based in Virginia, USA.',
  applicationName: 'Gyanav Solutions',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  authors: [{ name: 'Gyanav Solutions', url: 'https://www.gyanavsolutions.com' }],
  creator: 'Gyanav Solutions',
  publisher: 'Gyanav Solutions',
  metadataBase: new URL('https://www.gyanavsolutions.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
    },
  },
  keywords: [
    // Brand & Entity Search Queries
    'Gyanav Solutions',
    'gyanavsolutions.com',
    'Gyanav Consulting Services',
    'Gyanav Dev Technologies',
    'Gyanav IT Consulting',
    'Gyanav Technology',

    // Core IT Consulting Keywords
    'IT Consulting',
    'IT Consulting Services',
    'Enterprise IT Advisory',
    'Technology Consulting Firm',
    'Strategic IT Consulting',
    'Vendor-Neutral IT Advisory',
    'Systems Architecture Advisory',
    'Enterprise Architecture Consulting',
    'Cloud Strategy & Modernization',
    'Fractional CTO Services',
    'Technical Due Diligence',
    'Digital Transformation Advisory',

    // Healthcare IT & Clinical Interoperability Keywords (High CPM & Search Volume)
    'Healthcare Technology Consulting',
    'Healthcare IT Advisory',
    'Clinical Data Interoperability',
    'FHIR R4 Integration Services',
    'HL7 Messaging Integration',
    'EHR EMR Integration Consulting',
    'Epic EHR Integration Advisory',
    'Cerner Oracle Health Interoperability',
    'Clinical Data Lake Architecture',
    'Telehealth System Architecture',
    'PACS Imaging Data Interoperability',
    'HIPAA Compliant Cloud Architecture',
    'HITECH Act Compliance Advisory',
    'Zero Trust Healthcare Security',
    'Healthcare Cloud Security Consulting',

    // Cloud, DevOps & Engineering
    'Cloud Migration Advisory',
    'Cloud DevOps Consulting',
    'AWS Cloud Consulting Services',
    'Google Cloud Healthcare API Consulting',
    'Azure Enterprise Cloud Advisory',
    'Kubernetes Architecture Consulting',
    'Microservices Architecture Design',
    'Event-Driven Systems Engineering',
    'API Gateway Integration Advisory',
    'Data Pipeline & Ingestion Engineering',
    'Custom Software Implementation',
    'Production Engineering Services',
    'Zero-Downtime Database Migration',

    // Geographic Authority & Local Presence Keywords
    'Virginia IT Consulting',
    'Virginia USA IT Consulting',
    'Virginia Technology Consulting Firm',
    'Northern Virginia IT Advisory',
    'Washington DC Metro IT Consulting',
    'US Healthcare Technology Advisory',
    'USA Enterprise IT Consultants',
  ],
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  icons: {
    icon: [
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: [{ url: '/logo.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Gyanav Solutions | Premier IT Consulting & Healthcare Technology Advisory',
    description:
      'Gyanav Solutions provides strategic enterprise IT consulting, healthcare data interoperability (FHIR R4/HL7), HIPAA cloud architecture, and custom software engineering based in Virginia, USA.',
    url: 'https://www.gyanavsolutions.com',
    siteName: 'Gyanav Solutions',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Gyanav Solutions - Strategic IT Consulting and Healthcare Technology Advisory in Virginia, USA',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gyanav Solutions | Premier IT Consulting & Healthcare Technology Advisory',
    description:
      'Providing strategic IT consulting, healthcare data interoperability (FHIR R4/HL7), and production-grade engineering implementation based in Virginia, USA.',
    images: ['/opengraph-image'],
    creator: '@gyanavsolutions',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
  classification: 'Enterprise IT Consulting, Healthcare Technology Advisory, Cloud Systems Architecture',
};

// Unified Schema.org @graph (Connected Knowledge Graph for Top Search & AI Bot Indexation)
const jsonLdGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    // 1. Corporate Identity & Authority
    {
      '@type': ['ProfessionalService', 'Organization'],
      '@id': 'https://www.gyanavsolutions.com/#organization',
      name: 'Gyanav Solutions',
      legalName: 'Gyanav Solutions',
      alternateName: [
        'Gyanav Consulting Services',
        'Gyanav Dev Technologies',
        'Gyanav IT Consulting',
        'Gyanav Technology',
      ],
      url: 'https://www.gyanavsolutions.com',
      logo: {
        '@type': 'ImageObject',
        '@id': 'https://www.gyanavsolutions.com/#logo',
        url: 'https://www.gyanavsolutions.com/logo.png',
        caption: 'Gyanav Solutions Logo',
      },
      image: {
        '@type': 'ImageObject',
        '@id': 'https://www.gyanavsolutions.com/#primaryimage',
        url: 'https://www.gyanavsolutions.com/opengraph-image',
        caption: 'Gyanav Solutions Consulting Practice',
      },
      description:
        'Gyanav Solutions is an enterprise IT consulting and healthcare technology advisory firm based in Virginia, USA. Specialized in cloud architecture, FHIR R4 and HL7 healthcare data interoperability, zero-trust HIPAA security, and production-grade software implementation.',
      email: 'hr@gyanavsolutions.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Virginia',
        addressRegion: 'VA',
        addressCountry: 'US',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '37.4316',
        longitude: '-78.6569',
      },
      areaServed: [
        { '@type': 'Country', name: 'United States' },
        { '@type': 'State', name: 'Virginia' },
        { '@type': 'AdministrativeArea', name: 'Washington DC Metro Area' },
      ],
      priceRange: '$$$$',
      foundingDate: '2021',
      sameAs: [
        'https://www.linkedin.com/company/gyanav-solutions',
      ],
      knowsAbout: [
        'Enterprise IT Consulting',
        'Healthcare Technology Interoperability',
        'FHIR R4 Protocol Implementation',
        'HL7 v2 & v3 Data Pipelines',
        'HIPAA & HITECH Cloud Compliance',
        'Zero Trust Architecture',
        'EHR & EMR System Integration',
        'Clinical Data Lakes',
        'AWS Cloud Infrastructure Advisory',
        'Google Cloud Healthcare API',
        'Kubernetes & Microservices Architecture',
        'API Gateway Strategy & Design',
        'Systems Engineering & Production Delivery',
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Enterprise IT Advisory & Implementation Services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              '@id': 'https://www.gyanavsolutions.com/#service-cloud',
              name: 'Cloud & Infrastructure Strategy',
              description:
                'Enterprise cloud blueprints, AWS/GCP/Azure modernization, vendor-neutral infrastructure evaluation, and resilient DevOps deployment.',
              provider: { '@id': 'https://www.gyanavsolutions.com/#organization' },
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              '@id': 'https://www.gyanavsolutions.com/#service-healthcare',
              name: 'Healthcare Systems & Clinical Data Interoperability',
              description:
                'FHIR R4/HL7 bidirectional data bridges, EHR/EMR master patient indices, telehealth platforms, PACS imaging workflows, and HIPAA-compliant data lakes.',
              provider: { '@id': 'https://www.gyanavsolutions.com/#organization' },
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              '@id': 'https://www.gyanavsolutions.com/#service-integration',
              name: 'Enterprise Systems & Data Integration',
              description:
                'Real-time event streaming architectures, distributed API gateways, legacy-to-cloud adaptors, and high-throughput data processing pipelines.',
              provider: { '@id': 'https://www.gyanavsolutions.com/#organization' },
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              '@id': 'https://www.gyanavsolutions.com/#service-security',
              name: 'Zero-Trust Security & HIPAA Governance',
              description:
                'Defense-in-depth security modeling, fine-grained access control (RBAC/ABAC), automated audit trails, and end-to-end cryptographic protection for PHI.',
              provider: { '@id': 'https://www.gyanavsolutions.com/#organization' },
            },
          },
        ],
      },
    },

    // 2. WebSite Entity with Search & Publisher Authority
    {
      '@type': 'WebSite',
      '@id': 'https://www.gyanavsolutions.com/#website',
      url: 'https://www.gyanavsolutions.com',
      name: 'Gyanav Solutions',
      description: 'Premier IT Consulting & Healthcare Technology Advisory',
      publisher: {
        '@id': 'https://www.gyanavsolutions.com/#organization',
      },
      inLanguage: 'en-US',
    },

    // 3. WebPage Entity
    {
      '@type': 'WebPage',
      '@id': 'https://www.gyanavsolutions.com/#webpage',
      url: 'https://www.gyanavsolutions.com',
      name: 'Gyanav Solutions | Premier IT Consulting & Healthcare Technology Advisory',
      isPartOf: {
        '@id': 'https://www.gyanavsolutions.com/#website',
      },
      about: {
        '@id': 'https://www.gyanavsolutions.com/#organization',
      },
      description:
        'Gyanav Solutions provides strategic enterprise IT consulting, healthcare data interoperability (FHIR R4 / HL7), HIPAA cloud architecture, and custom software engineering based in Virginia, USA.',
      breadcrumb: {
        '@id': 'https://www.gyanavsolutions.com/#breadcrumb',
      },
      inLanguage: 'en-US',
    },

    // 4. Breadcrumb Navigation Entity
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://www.gyanavsolutions.com/#breadcrumb',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.gyanavsolutions.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'About Firm',
          item: 'https://www.gyanavsolutions.com/#about',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Consulting Practice',
          item: 'https://www.gyanavsolutions.com/#services',
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: 'Careers & Opportunities',
          item: 'https://www.gyanavsolutions.com/#jobs',
        },
        {
          '@type': 'ListItem',
          position: 5,
          name: 'Engagement & Contact',
          item: 'https://www.gyanavsolutions.com/#contact',
        },
        {
          '@type': 'ListItem',
          position: 6,
          name: 'Virginia Operations',
          item: 'https://www.gyanavsolutions.com/#location',
        },
      ],
    },

    // 5. Frequently Asked Questions (FAQPage) for Rich Answers & AI Citations
    {
      '@type': 'FAQPage',
      '@id': 'https://www.gyanavsolutions.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What services does Gyanav Solutions provide?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Gyanav Solutions provides strategic IT consulting, enterprise cloud architecture, healthcare technology interoperability (FHIR R4 and HL7 data protocols), HIPAA-compliant infrastructure advisory, and production software implementation for organizations with complex requirements.',
          },
        },
        {
          '@type': 'Question',
          name: 'Where is Gyanav Solutions located and what regions are served?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Gyanav Solutions is headquartered in Virginia, USA, serving enterprise and healthcare clients nationwide across the United States.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does Gyanav Solutions implement healthcare data interoperability?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We engineer bidirectional FHIR R4 and HL7 v2/v3 pipelines, EHR/EMR interfaces (including Epic, Cerner Oracle Health, and custom portals), clinical data lakes, telehealth APIs, and PACS imaging interoperability that strictly adhere to HIPAA and HITECH standards.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Gyanav Solutions an independent, vendor-neutral consulting firm?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Gyanav Solutions operates as an independent technical advisory firm. We do not resell proprietary software licenses, push vendor sales quotas, or accept commissions. Our architectural recommendations are strictly guided by cost-efficiency, security, and long-term viability.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does Gyanav Solutions ensure HIPAA and Zero-Trust Cloud Security?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We apply defense-in-depth zero-trust principles across all systems: fine-grained role-based access control (RBAC), end-to-end AES-256 encryption at rest and in transit, comprehensive audit logging, and automated compliance telemetry on AWS, GCP, and Azure.',
          },
        },
        {
          '@type': 'Question',
          name: 'How can our organization engage Gyanav Solutions for advisory or implementation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Organizations can initiate an engagement directly by reaching out to hr@gyanavsolutions.com or submitting their project requirements via the engagement portal on gyanavsolutions.com.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} scroll-smooth scroll-pt-20 sm:scroll-pt-24`}
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />

        {/* Geo Position Authority for Local Search Engines */}
        <meta name="geo.region" content="US-VA" />
        <meta name="geo.placename" content="Virginia, USA" />
        <meta name="geo.position" content="37.4316;-78.6569" />
        <meta name="ICBM" content="37.4316, -78.6569" />
        {/* Deep Knowledge Graph Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
      </head>
      <body className="bg-[#fafafc] text-slate-900 antialiased selection:bg-blue-600/15 selection:text-blue-900 overflow-x-hidden min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
