import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://roots2global.com';
const siteName = 'Roots2Global - Premium Indian Snacks';
const siteDescription = 'Discover authentic Taste of Indian Desi - premium Indian snacks delivered globally. From masala peanuts to traditional mixtures, taste the flavors of India.';

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'Indian snacks',
    'Taste of Indian Desi',
    'masala peanuts',
    'namkeen',
    'traditional snacks',
    'global delivery',
    'Indian food',
    'snacks online',
    'authentic Indian snacks',
  ],
  authors: [{ name: 'Roots2Global' }],
  creator: 'Roots2Global',
  publisher: 'Roots2Global',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 1200,
        height: 630,
        alt: 'Roots2Global - Premium Indian Snacks',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: [`${siteUrl}/logo.png`],
    creator: '@roots2global',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export function generateProductMetadata(product: {
  name: string;
  description: string;
  image: string;
  price: number;
}): Metadata {
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [
        {
          url: product.image,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      type: 'website', // OpenGraph doesn't support 'product' type, using 'website' instead
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  };
}

