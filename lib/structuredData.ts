/**
 * Structured Data (JSON-LD) for SEO
 */

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Roots2Global',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://roots2global.com',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://roots2global.com'}/logo.png`,
    description: 'Premium Indian snacks delivered globally',
    sameAs: [
      'https://www.facebook.com/roots2global',
      'https://www.twitter.com/roots2global',
      'https://www.instagram.com/roots2global',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-XXX-XXX-XXXX',
      contactType: 'customer service',
      email: 'info@roots2global.com',
    },
  };
}

export function generateProductSchema(product: {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 0,
      },
    }),
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://roots2global.com'}${item.url}`,
    })),
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Roots2Global',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://roots2global.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://roots2global.com'}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

