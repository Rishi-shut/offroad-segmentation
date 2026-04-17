import React from 'react';
import { X, Shield, FileText, Cookie } from 'lucide-react';

/**
 * LegalPage Component
 * -------------------
 * Renders Privacy Policy, Terms of Service, or Cookie Policy
 * as a full-screen overlay. Passed the page type and a close handler.
 */

const LEGAL_CONTENT = {
  privacy: {
    icon: Shield,
    title: 'Privacy Policy',
    lastUpdated: 'April 18, 2026',
    sections: [
      {
        heading: '1. Information We Collect',
        body: `When you use Off-Road AI, we collect the following types of information:

• **Account Information**: Email address, name, and authentication credentials managed securely through Clerk.
• **Usage Data**: Images, video frames, and camera captures you upload for segmentation analysis.
• **Prediction Data**: Segmentation results, terrain classifications, and associated metadata stored in our databases.
• **Technical Data**: Browser type, device information, IP address, and access timestamps for security and analytics.`
      },
      {
        heading: '2. How We Use Your Information',
        body: `Your information is used to:

• Provide and maintain the segmentation analysis service.
• Store your prediction history for future reference and comparison.
• Enable vector-based similarity search across your historical data via Qdrant.
• Improve model accuracy and platform performance through aggregated, anonymized analytics.
• Communicate important updates about the service.`
      },
      {
        heading: '3. Data Storage & Security',
        body: `• All prediction data is stored in encrypted PostgreSQL databases (Neon Cloud) with automated backups.
• Vector embeddings are stored in Qdrant Cloud with enterprise-grade encryption at rest.
• Authentication is handled by Clerk with industry-standard security practices including MFA support.
• Uploaded images are processed in-memory and are not permanently stored on our servers unless explicitly saved to your history.`
      },
      {
        heading: '4. Data Sharing',
        body: `We do not sell, trade, or rent your personal information to third parties. Your data may be shared only:

• With service providers (Clerk, Neon, Qdrant) necessary to operate the platform.
• When required by law or to protect the rights and safety of our users.
• In aggregated, anonymized form for research and development purposes.`
      },
      {
        heading: '5. Your Rights',
        body: `You have the right to:

• Access and download your prediction history at any time.
• Request deletion of your account and all associated data.
• Opt out of non-essential data collection.
• Export your segmentation masks and results.

To exercise these rights, contact us at mriganksingh792005@gmail.com.`
      },
      {
        heading: '6. Contact',
        body: `For privacy-related inquiries, please contact:
**Email**: mriganksingh792005@gmail.com
**GitHub**: github.com/Rishi-shut/offroad-segmentation`
      }
    ]
  },

  terms: {
    icon: FileText,
    title: 'Terms of Service',
    lastUpdated: 'April 18, 2026',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: `By accessing or using Off-Road AI ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service.`
      },
      {
        heading: '2. Description of Service',
        body: `Off-Road AI provides AI-powered semantic segmentation for off-road terrain imagery. The Service includes:

• Image upload and segmentation analysis using NVIDIA SegFormer models.
• Video frame extraction and batch processing capabilities.
• Camera capture and real-time analysis.
• Prediction history storage and vector-based similarity search.
• API access for programmatic integration.`
      },
      {
        heading: '3. User Accounts',
        body: `• You must create an account via Clerk authentication to access the dashboard.
• You are responsible for maintaining the confidentiality of your account credentials.
• You must provide accurate and complete information during registration.
• You may not share your account with others or create multiple accounts.`
      },
      {
        heading: '4. Acceptable Use',
        body: `You agree not to:

• Upload content that is illegal, harmful, or violates third-party rights.
• Attempt to reverse-engineer, decompile, or exploit the segmentation models.
• Use the Service for any purpose that could cause harm to autonomous vehicle safety.
• Exceed reasonable usage limits or attempt to overload the system.
• Use automated tools to scrape or bulk-download data from the Service.`
      },
      {
        heading: '5. Intellectual Property',
        body: `• The SegFormer model architecture is the intellectual property of NVIDIA Corporation.
• The Off-Road AI platform, including its UI, backend, and custom training code, is open-source under the repository license.
• You retain ownership of all images, videos, and data you upload to the Service.
• Segmentation masks generated by the Service are provided to you with full usage rights.`
      },
      {
        heading: '6. Disclaimer of Warranties',
        body: `The Service is provided "as is" without warranties of any kind. We do not guarantee:

• 100% accuracy of terrain classifications.
• Uninterrupted or error-free operation.
• Suitability for safety-critical autonomous navigation decisions without human oversight.`
      },
      {
        heading: '7. Limitation of Liability',
        body: `Off-Road AI and its contributors shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service. Total liability is limited to the amount you have paid for the Service (if any).`
      },
      {
        heading: '8. Contact',
        body: `For questions about these terms, contact us at:
**Email**: mriganksingh792005@gmail.com
**GitHub**: github.com/Rishi-shut/offroad-segmentation`
      }
    ]
  },

  cookies: {
    icon: Cookie,
    title: 'Cookie Policy',
    lastUpdated: 'April 18, 2026',
    sections: [
      {
        heading: '1. What Are Cookies',
        body: `Cookies are small text files stored on your device when you visit a website. They help us provide a better experience by remembering your preferences and authentication state.`
      },
      {
        heading: '2. Cookies We Use',
        body: `Off-Road AI uses the following types of cookies:

• **Essential Cookies**: Required for authentication (managed by Clerk). These cookies maintain your login session and cannot be disabled.
• **Functional Cookies**: Store your preferences such as active tab selection and UI settings.
• **Analytics Cookies**: Help us understand how users interact with the platform to improve the experience. These are anonymized and aggregated.`
      },
      {
        heading: '3. Third-Party Cookies',
        body: `Our service integrates with third parties that may set their own cookies:

• **Clerk** (authentication): Session management and security tokens.
• **Cloudinary** (media delivery): Content delivery optimization.

These third parties have their own privacy and cookie policies.`
      },
      {
        heading: '4. Managing Cookies',
        body: `You can control cookies through your browser settings:

• Most browsers allow you to view, delete, and block cookies.
• Disabling essential cookies may prevent you from signing in to the Service.
• You can clear all cookies at any time through your browser's privacy settings.`
      },
      {
        heading: '5. Contact',
        body: `For questions about our cookie practices, contact us at:
**Email**: mriganksingh792005@gmail.com`
      }
    ]
  }
};

function LegalPage({ page, onClose }) {
  const content = LEGAL_CONTENT[page];
  if (!content) return null;

  const IconComponent = content.icon;

  return (
    <div className="legal-overlay" onClick={onClose}>
      <div className="legal-container" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button className="legal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {/* Header */}
        <div className="legal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <IconComponent size={28} color="var(--primary)" />
            <h1>{content.title}</h1>
          </div>
          <p className="legal-date">Last updated: {content.lastUpdated}</p>
        </div>

        {/* Content Sections */}
        <div className="legal-body">
          {content.sections.map((section, i) => (
            <div key={i} className="legal-section">
              <h2>{section.heading}</h2>
              <div dangerouslySetInnerHTML={{
                __html: section.body
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>')
              }} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="legal-footer">
          <p>Off-Road AI — Terrain Intelligence Platform</p>
          <button className="btn-primary" onClick={onClose} style={{ padding: '10px 24px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default LegalPage;
