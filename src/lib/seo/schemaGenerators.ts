import type { ToolDefinition } from '../../types';

export interface ToolPageSchemaOptions {
  tool: ToolDefinition;
  origin: string;
  pageUrl: string;
  categoryName?: string;
  categorySlug?: string;
  faqs?: Array<{ question: string; answer: string }>;
  howItWorksSteps?: string[];
  ogImageUrl?: string;
}

export interface HomePageSchemaOptions {
  origin: string;
  tools: ToolDefinition[];
  ogImageUrl?: string;
}

/**
 * Maps FreeTools category to appropriate Schema.org ApplicationCategory.
 */
function getApplicationCategory(category: string): string {
  switch (category) {
    case 'image':
    case 'video':
      return 'MultimediaApplication';
    case 'developer':
      return 'DeveloperApplication';
    case 'calculator':
      return 'BusinessApplication';
    case 'pdf':
    case 'text':
    default:
      return 'UtilitiesApplication';
  }
}

/**
 * Generates a unified, interconnected Schema.org @graph for a specific tool page.
 * Includes WebPage, SoftwareApplication, HowTo, FAQPage, BreadcrumbList, and TechArticle.
 */
export function generateToolPageSchemaGraph(options: ToolPageSchemaOptions): Record<string, unknown> {
  const {
    tool,
    origin,
    pageUrl,
    categoryName = tool.category,
    categorySlug = tool.category,
    faqs = [],
    howItWorksSteps = [],
    ogImageUrl = `${origin}/favicon.svg`,
  } = options;

  const websiteId = `${origin}/#website`;
  const orgId = `${origin}/#organization`;
  const webpageId = `${pageUrl}#webpage`;
  const softwareId = `${pageUrl}#software`;
  const howtoId = `${pageUrl}#howto`;
  const faqId = `${pageUrl}#faq`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const articleId = `${pageUrl}#article`;

  // Default steps fallback
  const defaultSteps = [
    `Open the ${tool.name} tool on FreeTools in your browser.`,
    `Select or drag-and-drop your input files or enter your data directly into the interactive workspace.`,
    `Adjust the parameters, filters, formats, or options to suit your exact requirements.`,
    `Instantly process and download or copy your final result directly on your device with 100% privacy.`,
  ];
  const stepsToUse = howItWorksSteps && howItWorksSteps.length > 0 ? howItWorksSteps : defaultSteps;

  // Default universal FAQs
  const defaultFaqs = [
    {
      question: `Is ${tool.name} completely free to use?`,
      answer: `Yes! ${tool.name} on FreeTools is free to use with no hidden paywalls, subscriptions, daily usage limits, or watermarks.`,
    },
    {
      question: `Are my files or data uploaded to your servers when using ${tool.name}?`,
      answer: `No. FreeTools is built on privacy-first client-side architecture. All computation and processing execute locally inside your browser sandbox using native browser APIs, Web Workers, and WebAssembly where appropriate. Uploaded files and data are not sent to FreeTools servers.`,
    },
    {
      question: `Does ${tool.name} work on mobile devices?`,
      answer: `Yes! You can use ${tool.name} smoothly on iOS (Safari, Chrome) and Android browsers without installing any third-party apps or browser extensions.`,
    },
    {
      question: `Why is in-browser processing faster than traditional converter websites?`,
      answer: `Traditional web converters require uploading files to remote servers, waiting in processing queues, and downloading files back. FreeTools processes data locally on your device with no upload wait and fast results.`,
    },
  ];

  // Ensure FAQs are deduplicated by question text
  const initialFaqs = faqs && faqs.length > 0 ? faqs : defaultFaqs;
  const seenQuestions = new Set<string>();
  const allFaqs = initialFaqs.filter((f) => {
    if (seenQuestions.has(f.question)) return false;
    seenQuestions.add(f.question);
    return true;
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [
      // 1. Organization Entity
      {
        '@type': 'Organization',
        '@id': orgId,
        name: 'FreeTools',
        url: `${origin}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${origin}/favicon.svg`,
          width: 512,
          height: 512,
        },
        sameAs: [],
      },

      // 2. WebSite Entity
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: `${origin}/`,
        name: 'FreeTools',
        description: 'Free Online Privacy-First Digital Utilities & Web Tools',
        publisher: { '@id': orgId },
      },

      // 3. BreadcrumbList Entity
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${origin}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: categoryName,
            item: `${origin}/#${categorySlug}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: tool.name,
            item: pageUrl,
          },
        ],
      },

      // 4. WebPage (ItemPage) Entity
      {
        '@type': 'ItemPage',
        '@id': webpageId,
        url: pageUrl,
        name: tool.seoTitle || `${tool.name} — Free Online Tool | FreeTools`,
        description: tool.seoDescription || tool.description,
        isPartOf: { '@id': websiteId },
        breadcrumb: { '@id': breadcrumbId },
        inLanguage: 'en-US',
        mainEntity: { '@id': softwareId },
        potentialAction: [
          {
            '@type': 'UseAction',
            target: [pageUrl],
          },
        ],
      },

      // 5. SoftwareApplication / WebApplication Entity
      {
        '@type': 'WebApplication',
        '@id': softwareId,
        name: tool.name,
        url: pageUrl,
        description: tool.seoDescription || tool.description,
        applicationCategory: getApplicationCategory(tool.category),
        applicationSubCategory: `${categoryName} Tool`,
        operatingSystem: 'All (Windows, macOS, Linux, iOS, Android)',
        browserRequirements: 'Requires modern web browser with HTML5 and JavaScript support.',
        softwareVersion: '2.5',
        inLanguage: 'en-US',
        isAccessibleForFree: true,
        image: ogImageUrl,
        screenshot: ogImageUrl,
        provider: { '@id': orgId },
        keywords: tool.keywords ? tool.keywords.join(', ') : '',
        featureList: [
          '100% Client-Side In-Browser Execution',
          'Zero Server Uploads & Total Data Privacy',
          'No Signups, Accounts, or Credit Cards Required',
          'High Speed Hardware Accelerated Processing',
          'Free to Use with No Watermarks',
        ],
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      },

      // 6. HowTo Entity
      {
        '@type': 'HowTo',
        '@id': howtoId,
        name: `How to use ${tool.name} online for free`,
        description: `Step-by-step guide to using ${tool.name} in your browser without uploading files to remote servers.`,
        totalTime: 'PT1M',
        step: stepsToUse.map((stepText, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: `Step ${idx + 1}: ${stepText.slice(0, 60)}...`,
          text: stepText,
          url: `${pageUrl}#step-${idx + 1}`,
        })),
      },

      // 7. FAQPage Entity
      {
        '@type': 'FAQPage',
        '@id': faqId,
        mainEntity: allFaqs.map((faqItem) => ({
          '@type': 'Question',
          name: faqItem.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faqItem.answer,
          },
        })),
      },

      // 8. TechArticle Entity (Connecting Encyclopedia / Deep Dive Documentation)
      {
        '@type': 'TechArticle',
        '@id': articleId,
        headline: `The Complete Guide to ${tool.name}: Architecture, Best Practices & In-Browser Mastery`,
        description: `Comprehensive technical breakdown and usage guide for ${tool.name}, powered by client-side browser APIs.`,
        author: { '@id': orgId },
        publisher: { '@id': orgId },
        mainEntityOfPage: pageUrl,
        inLanguage: 'en-US',
      },
    ],
  };
}

/**
 * Generates a unified Schema.org @graph for the FreeTools Homepage.
 * Includes WebSite with Sitelinks SearchBox, Organization, SoftwareApplication suite, and full ItemList.
 */
export function generateHomePageSchemaGraph(options: HomePageSchemaOptions): Record<string, unknown> {
  const { origin, tools, ogImageUrl = `${origin}/favicon.svg` } = options;

  const websiteId = `${origin}/#website`;
  const orgId = `${origin}/#organization`;
  const suiteId = `${origin}/#suite`;
  const itemListId = `${origin}/#itemlist`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      // 1. Organization Entity
      {
        '@type': 'Organization',
        '@id': orgId,
        name: 'FreeTools',
        url: `${origin}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${origin}/favicon.svg`,
          width: 512,
          height: 512,
        },
        description: 'Privacy-first suite of in-browser client-side digital utilities, PDF converters, image enhancers, calculators, and developer tools.',
        sameAs: [],
      },

      // 2. WebSite Entity with Sitelinks SearchBox
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: `${origin}/`,
        name: 'FreeTools',
        alternateName: ['FreeTools', 'FreeToolsHub', 'Free Tools Online', 'FreeTools Digital Utilities', 'FreeTools Web Tools'],
        description: '55+ Free In-Browser Digital Utilities & Developer Tools with 0 Server Uploads. Private by Design.',
        publisher: { '@id': orgId },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${origin}/?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: 'en-US',
      },

      // 3. SoftwareApplication Suite Entity
      {
        '@type': 'WebApplication',
        '@id': suiteId,
        name: 'FreeTools Digital Utilities Suite',
        url: `${origin}/`,
        description: 'A comprehensive suite of 55+ free client-side utilities including image compressors, PDF converters, calculators, code formatters, and regex testers.',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'All (Windows, macOS, Linux, iOS, Android)',
        browserRequirements: 'Requires modern web browser with HTML5 and JavaScript support.',
        isAccessibleForFree: true,
        image: ogImageUrl,
        provider: { '@id': orgId },
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      },

      // 4. ItemList of all Included Utilities (for Rich Directory & SERP Carousels)
      {
        '@type': 'ItemList',
        '@id': itemListId,
        name: 'FreeTools Digital Utilities Catalog',
        description: 'Complete list of all free, in-browser digital utilities available on FreeTools.',
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: tool.name,
          description: tool.description,
          url: `${origin}/tools/${tool.slug}`,
        })),
      },
    ],
  };
}
