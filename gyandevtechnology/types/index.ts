export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  summary: string;
  description: string;
  deliverables: string[];
  focusAreas: string[];
  keyPoints: string[];
  iconName: string;
}

export interface ProcessStage {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  keyActivities: string[];
  outcomes: string[];
  outcome: string;
}

export interface PrincipleItem {
  id: string;
  number: string;
  title: string;
  description: string;
  application: string;
}

export interface HealthcareSystemPillar {
  id: string;
  title: string;
  description: string;
  aspects: string[];
}

export interface LayerInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  components: string[];
  metrics: { label: string; value: string }[];
}

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'it-consulting',
    number: '01',
    title: 'Cloud & Infrastructure Strategy',
    summary: 'Evaluating architectures, migrating workloads, and modernizing legacy foundations.',
    description: 'We partner with enterprise leadership to evaluate technical feasibility, resolve debt, and design scalable cloud topologies.',
    deliverables: ['Enterprise Architecture Blueprints', 'Cloud Migration Strategies', 'Vendor Evaluation & Fit Analysis', 'Technical Risk Assessments'],
    focusAreas: ['Enterprise Architecture', 'Cloud Strategy', 'Technology Assessment', 'Strategic Roadmapping'],
    keyPoints: [
      'Comprehensive system audits and feasibility reviews',
      'Target-state enterprise architecture blueprints',
      'Risk-mitigated technology modernization roadmaps',
      'Unbiased vendor and platform selection advisory',
    ],
    iconName: 'Compass',
  },
  {
    id: 'healthcare-tech',
    number: '02',
    title: 'Healthcare Systems & Data Flow',
    summary: 'Connecting clinical systems, EHRs, and data pipelines with regulatory compliance.',
    description: 'Specialized healthcare advisory that bridges clinical operations and technology with HIPAA-grade compliance and FHIR standards.',
    deliverables: ['HL7 / FHIR Integration Pipelines', 'EHR / EMR Interoperability Gateways', 'HIPAA & HITECH Security Compliance', 'Clinical Workflow Streamlining'],
    focusAreas: ['EHR Integration', 'FHIR / HL7 Interoperability', 'HIPAA Compliance', 'Clinical Data Pipelines'],
    keyPoints: [
      'FHIR and HL7 standard data protocol orchestration',
      'EHR/EMR bidirectional pipeline development',
      'Clinical usability and workflow enhancement',
      'HIPAA and zero-trust cloud data governance',
    ],
    iconName: 'Activity',
  },
  {
    id: 'implementation',
    number: '03',
    title: 'Systems & Data Integration',
    summary: 'Bridging disparate backends, legacy databases, and APIs into unified streams.',
    description: 'We connect legacy architectures and modern cloud solutions into resilient, event-driven data pipelines.',
    deliverables: ['Event-Driven Data Bus Pipelines', 'Legacy-to-Cloud Bridge Adaptors', 'Real-Time Analytics Ingestion', 'Unified Identity & Access Federation'],
    focusAreas: ['Data Federation', 'Event-Driven Pipelines', 'Legacy Adaptors', 'API Modernization'],
    keyPoints: [
      'High-throughput microservices and API gateways',
      'Continuous deployment automation and rollback strategies',
      'End-to-end integration and load testing verification',
      'Post-cutover stabilization and observability telemetry',
    ],
    iconName: 'Workflow',
  },
  {
    id: 'systems-integration',
    number: '04',
    title: 'Software & Platform Engineering',
    summary: 'Translating strategy into stable, production-ready enterprise systems.',
    description: 'Our engineering discipline translates strategic intent into dependable, testable, and maintainable software systems with zero downtime.',
    deliverables: ['Custom Enterprise System Engineering', 'API Gateways & Microservices', 'Automated CI/CD Delivery Pipelines', 'Production Stabilization & Telemetry'],
    focusAreas: ['System Engineering', 'Production Deployment', 'Pipeline Automation', 'System Verification'],
    keyPoints: [
      'Event-driven messaging and real-time Kafka/PubSub buses',
      'Secure adaptors for legacy mainframe and relational backends',
      'Robust schema validation and data cleansing mechanisms',
      'Multi-region data synchronization and disaster resilience',
    ],
    iconName: 'Wrench',
  },
  {
    id: 'security-governance',
    number: '05',
    title: 'Security & Governance',
    summary: 'Hardening cloud infrastructures with zero-trust network policies, identity access, and auditability.',
    description: 'Engineering systems with security built into every layer. We design zero-trust perimeters, role-based access management, and automated continuous compliance auditing.',
    deliverables: ['Zero-Trust Architecture Implementation', 'Role-Based Access Control (RBAC)', 'Automated Compliance Telemetry', 'Cloud Security Posture Optimization'],
    focusAreas: ['Zero Trust', 'RBAC & Identity', 'Audit Telemetry', 'Infrastructure Hardening'],
    keyPoints: [
      'Zero-trust network segmentation and mTLS encryption',
      'Fine-grained RBAC and IAM lifecycle policies',
      'Continuous audit telemetry and SIEM logging',
      'Infrastructure as Code (IaC) security scanning',
    ],
    iconName: 'Shield',
  },
];

export const STAGES: ProcessStage[] = [
  {
    id: 'execution',
    number: '3',
    title: 'Implement & Deliver',
    subtitle: 'Production Execution',
    description: 'Translating designs into live, verified, and test-covered production software and integrations.',
    keyActivities: ['System engineering', 'Automated testing', 'Continuous integration', 'Staged environment deployment'],
    outcomes: ['Production-Grade System Integration', 'Automated Verification & CI/CD Pipelines'],
    outcome: 'Functional, tested, and reliable production deployment.',
  },
];

export const PRINCIPLES: PrincipleItem[] = [
  {
    id: 'senior-focus',
    number: '01',
    title: 'Direct Senior Attention',
    description: 'You work directly with seasoned consulting practitioners who understand both strategic vision and deep engineering implementation details.',
    application: 'No junior handoffs; consistent principal-level engagement.',
  },
  {
    id: 'vendor-neutral',
    number: '02',
    title: 'Vendor-Neutral Advisory',
    description: 'Our recommendations are strictly based on architectural fit, cost-efficiency, and operational viability—never tied to vendor sales quotas.',
    application: 'Objective, unbiased technology evaluation tailored to your needs.',
  },
  {
    id: 'practical-depth',
    number: '03',
    title: 'Practical Engineering Depth',
    description: 'We bridge high-level corporate strategy with concrete code, pipelines, data schemas, and production deployment realities.',
    application: 'Strategy that survives contact with production environments.',
  },
  {
    id: 'clarity-first',
    number: '04',
    title: 'Clarity & Accountability',
    description: 'Transparent communication, realistic milestone projections, and measurable outcomes at every phase of the engagement.',
    application: 'Predictable delivery timelines with zero ambiguous promises.',
  },
];

export const LAYERS: LayerInfo[] = [
  {
    id: 'strategy',
    name: 'Strategic Advisory & Architecture',
    category: 'Foundation',
    description: 'Deconstructs business objectives into scalable system designs, risk mitigations, and technology roadmaps.',
    components: ['Enterprise Architecture Blueprints', 'Legacy Modernization Plans', 'Vendor-Neutral Fit Analysis', 'Cloud Readiness Assessment'],
    metrics: [
      { label: 'Scope', value: 'Holistic' },
      { label: 'Posture', value: 'Vendor-Neutral' },
      { label: 'Focus', value: 'Objective Alignment' },
    ],
  },
  {
    id: 'integration',
    name: 'Integration & Interoperability Gateway',
    category: 'Connectivity',
    description: 'Ensures structured communication between clinical systems, legacy backends, and modern service pipelines.',
    components: ['API & Event Bus Architecture', 'Data Pipeline Ingestion', 'Healthcare Interoperability (HL7/FHIR)', 'Secure Webhook Handlers'],
    metrics: [
      { label: 'Reliability', value: 'Mission-Critical' },
      { label: 'Latency', value: 'Optimized' },
      { label: 'Format', value: 'Standardized' },
    ],
  },
  {
    id: 'security',
    name: 'Security & Governance Perimeter',
    category: 'Governance',
    description: 'Enforces identity access policies, encryption standards, and verifiable compliance across environments.',
    components: ['Role-Based Access Control (RBAC)', 'End-to-End Encryption Protocols', 'Audit Trail Telemetry', 'Compliance Boundary Verification'],
    metrics: [
      { label: 'Standard', value: 'Strict Policy' },
      { label: 'Access', value: 'Principle of Least Privilege' },
      { label: 'Audit', value: 'Continuous' },
    ],
  },
  {
    id: 'execution',
    name: 'Implementation & Operational Delivery',
    category: 'Delivery',
    description: 'Translates architectural specifications into live, stable, documented, and tested systems in production.',
    components: ['Automated Deployment Pipelines', 'Environment Staging & Verification', 'Zero-Downtime Cutover Plans', 'Post-Launch Stabilization'],
    metrics: [
      { label: 'Execution', value: 'Structured' },
      { label: 'Cutover', value: 'Managed Risk' },
      { label: 'Transfer', value: 'Complete Documentation' },
    ],
  },
];
