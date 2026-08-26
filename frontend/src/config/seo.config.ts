import type { Page } from "../app/App";

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string[];
}

export const DEFAULT_SEO: PageSEO = {
  title: "RoomBae — Enterprise Luxury PG & Co-Living Management",
  description: "RoomBae is India's leading luxury PG and co-living management ecosystem. Seamless digital onboarding, instant rent billing, biometric access, and room allocation.",
  keywords: ["PG management system", "co-living software", "hostel management", "rent collection", "room allocation"],
};

export const PAGE_SEO_CONFIG: Record<Page, PageSEO> = {
  landing: {
    title: "RoomBae — Luxury Co-Living & Smart PG Management Platform",
    description: "Streamline operations for PG owners and residents. Automate rent billing, room management, digital agreements, and tenant onboarding with RoomBae.",
    keywords: ["luxury PG software", "smart PG management", "co-living management app", "digital rent collection"],
  },
  dashboard: {
    title: "Property Dashboard | RoomBae",
    description: "Real-time occupancy analytics, collection statistics, and management alerts across all your PG properties.",
  },
  "admin-console": {
    title: "Platform Admin Console | RoomBae",
    description: "Master administrative control, property verification queue, and platform-wide compliance governance.",
  },
  "god-console": {
    title: "Super Admin God Console | RoomBae",
    description: "Global system diagnostics, database telemetry, and cross-cluster management console.",
  },
  properties: {
    title: "Property Portfolio Management | RoomBae",
    description: "Manage buildings, floors, room configurations, pricing rules, and property amenities seamlessly.",
  },
  residents: {
    title: "Resident Directory & KYC | RoomBae",
    description: "Track resident occupancy, digital KYC verifications, emergency contacts, and active tenancy agreements.",
  },
  billing: {
    title: "Automated Invoicing & Payments | RoomBae",
    description: "Automated monthly rent invoice generation, Razorpay UPI reconciliation, utility billing, and payment reminders.",
  },
  complaints: {
    title: "Maintenance & Complaint Kanban | RoomBae",
    description: "Track tenant service requests, maintenance tickets, SLA resolutions, and technician dispatch in real time.",
  },
  analytics: {
    title: "Revenue & Occupancy Analytics | RoomBae",
    description: "Comprehensive financial reporting, monthly revenue breakdown, occupancy forecasting, and cash flow analysis.",
  },
  "pg-listing": {
    title: "Find Premium PGs & Verified Co-Living Spaces | RoomBae",
    description: "Explore verified luxury PGs with high-speed WiFi, daily housekeeping, chef-crafted meals, and 24/7 biometric security.",
  },
  "pg-details": {
    title: "PG Details & Room Virtual Tour | RoomBae",
    description: "View verified property photos, amenities, room sharing tiers, real-time bed availability, and schedule a tour.",
  },
  auth: {
    title: "Sign In & Register | RoomBae",
    description: "Access your RoomBae resident portal or property management console with secure two-factor authentication.",
  },
  "complete-profile": {
    title: "Complete Onboarding Profile | RoomBae",
    description: "Finalize your profile details, legal document acceptance, and emergency contact information.",
  },
  "resident-portal": {
    title: "Resident Experience Portal | RoomBae",
    description: "View your tenancy lease, pay rent securely via UPI/cards, raise service requests, and log guest visits.",
  },
  "verify-agreement": {
    title: "Digital Tenancy Agreement Verification | RoomBae",
    description: "Legally binding digital signature and verification for room tenancy agreements and house rules.",
  },
  "resident-register": {
    title: "Resident Self-Registration | RoomBae",
    description: "Register for your assigned PG room, complete digital KYC, and initiate check-in paperwork.",
  },
  shortlist: {
    title: "Saved Properties & Shortlist | RoomBae",
    description: "Compare your shortlisted PG accommodations, pricing tiers, and amenities side by side.",
  },
  tours: {
    title: "Scheduled Property Visits & Tours | RoomBae",
    description: "Manage upcoming physical and virtual walkthroughs with PG estate managers.",
  },
  application: {
    title: "Tenancy Application Status | RoomBae",
    description: "Track the real-time approval status of your PG booking and onboarding application.",
  },
  "move-in-dashboard": {
    title: "Move-In Checklist & Key Handover | RoomBae",
    description: "Step-by-step move-in guide, inventory inspection checklist, and room handover confirmation.",
  },
  rooms: {
    title: "Room Inventory Management | RoomBae",
    description: "Configure room capacities, sharing layouts, AC/non-AC variants, and monthly rental rates.",
  },
  beds: {
    title: "Bed Allocation Matrix | RoomBae",
    description: "Visual bed matrix, vacancy tracking, and one-click resident assignment across all properties.",
  },
  visitors: {
    title: "Visitor Management & Guest Logs | RoomBae",
    description: "Digital gatekeeper log, visitor entry approvals, and overnight stay tracking.",
  },
  notifications: {
    title: "Activity Notifications & Alerts | RoomBae",
    description: "Stay informed on rent dues, maintenance updates, visitor entries, and property announcements.",
  },
  settings: {
    title: "Account & System Preferences | RoomBae",
    description: "Configure notification channels, security credentials, device sessions, and user profiles.",
  },
  about: {
    title: "About Us — Modernizing Co-Living | RoomBae",
    description: "Discover RoomBae's mission to transform student and working-professional accommodation through technology.",
  },
  blog: {
    title: "RoomBae Insights — Co-Living & PropTech Trends",
    description: "Industry news, property management advice, tenant experience guides, and PG business best practices.",
  },
  careers: {
    title: "Join Our Team — Careers at RoomBae",
    description: "Help build the future of proptech and student housing infrastructure across India.",
  },
  press: {
    title: "Press & Media Kit | RoomBae",
    description: "Latest news announcements, brand assets, press releases, and media coverage of RoomBae.",
  },
  changelog: {
    title: "Product Changelog & Updates | RoomBae",
    description: "Explore the latest features, security enhancements, and performance upgrades shipped to RoomBae.",
  },
  roadmap: {
    title: "Product Roadmap | RoomBae",
    description: "Upcoming features in development: AI rent forecasting, smart IoT locks, and automated biometric check-in.",
  },
  documentation: {
    title: "User Guide & Knowledge Base | RoomBae",
    description: "Comprehensive guides for PG owners and residents on mastering the RoomBae platform.",
  },
  "help-center": {
    title: "Help & Customer Support | RoomBae",
    description: "Get immediate answers to frequently asked questions or contact our dedicated support team.",
  },
  "api-reference": {
    title: "Developer API Reference | RoomBae",
    description: "Integrate with RoomBae's RESTful API for biometric devices, payment gateways, and accounting tools.",
  },
  status: {
    title: "System Status & Uptime | RoomBae",
    description: "Real-time system health, API uptime monitoring, and scheduled maintenance notifications.",
  },
  "privacy-policy": {
    title: "Privacy Policy | RoomBae",
    description: "Our commitment to protecting your personal data, biometric identifiers, and financial records.",
  },
  "terms-of-service": {
    title: "Terms of Service | RoomBae",
    description: "Terms and conditions governing the use of RoomBae software and platform services.",
  },
  "cookie-policy": {
    title: "Cookie Policy | RoomBae",
    description: "Information on how RoomBae uses essential session cookies for secure cross-origin authentication.",
  },
  "not-found": {
    title: "404 - Page Not Found | RoomBae",
    description: "The requested page could not be found. Explore verified luxury PGs or return to your RoomBae dashboard.",
  },
};

/**
 * Dynamically updates document.title and meta description on route navigation
 */
export const updateDocumentSEO = (page: Page, dynamicTitle?: string) => {
  if (typeof document === "undefined") return;

  const config = PAGE_SEO_CONFIG[page] || DEFAULT_SEO;
  const title = dynamicTitle ? `${dynamicTitle} | RoomBae` : config.title;
  document.title = title;

  // Update Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.setAttribute("name", "description");
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute("content", config.description);

  // Update OpenGraph Title & Description
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement("meta");
    ogTitle.setAttribute("property", "og:title");
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute("content", title);

  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement("meta");
    ogDesc.setAttribute("property", "og:description");
    document.head.appendChild(ogDesc);
  }
  ogDesc.setAttribute("content", config.description);
};
