import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  locale?: string;
  alternateLocales?: string[];
  author?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  structuredData?: any;
  customMetaTags?: { name: string; content: string }[];
}

export interface SEOPageConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  structuredData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SEOService {
  private readonly defaultTitle = 'CarCommun - Vehicle Maintenance Management';
  private readonly defaultDescription = 'Comprehensive vehicle maintenance management system with predictive maintenance, maintenance scheduling, and cost tracking.';
  private readonly defaultKeywords = [
    'car maintenance',
    'vehicle management',
    'maintenance tracking',
    'predictive maintenance',
    'automotive',
    'maintenance scheduler',
    'car service'
  ];
  private readonly defaultImage = '/assets/images/og-default.jpg';
  private readonly siteUrl = 'https://carcommun.com';

  constructor(
    private meta: Meta,
    private title: Title,
    private router: Router
  ) {
    this.initializeSEOService();
  }

  /**
   * Initialize SEO service with router events
   */
  private initializeSEOService(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateSEOFromRoute();
      });

    // Set default meta tags
    this.setDefaultMetaTags();
  }

  /**
   * Update SEO based on current route
   */
  private updateSEOFromRoute(): void {
    const route = this.router.routerState.root;
    const routeData = this.getRouteData(route);
    
    if (routeData && routeData.seo) {
      this.updateSEO(routeData.seo);
    } else {
      this.setDefaultSEO();
    }
  }

  /**
   * Get route data from activated route tree
   */
  private getRouteData(route: any): any {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.snapshot.data;
  }

  /**
   * Set default meta tags for the application
   */
  private setDefaultMetaTags(): void {
    // Basic meta tags
    this.meta.addTags([
      { name: 'description', content: this.defaultDescription },
      { name: 'keywords', content: this.defaultKeywords.join(', ') },
      { name: 'author', content: 'CarCommun Team' },
      { name: 'robots', content: 'index, follow' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#2196F3' },
      { name: 'msapplication-TileColor', content: '#2196F3' }
    ]);

    // Open Graph meta tags
    this.meta.addTags([
      { property: 'og:title', content: this.defaultTitle },
      { property: 'og:description', content: this.defaultDescription },
      { property: 'og:image', content: `${this.siteUrl}${this.defaultImage}` },
      { property: 'og:url', content: `${this.siteUrl}${this.router.url}` },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'CarCommun' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'article:author', content: 'CarCommun Team' },
      { property: 'article:section', content: 'Technology' },
      { property: 'article:tag', content: this.defaultKeywords.join(', ') }
    ]);

    // Twitter Card meta tags
    this.meta.addTags([
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@carcommun' },
      { name: 'twitter:creator', content: '@carcommun' },
      { name: 'twitter:title', content: this.defaultTitle },
      { name: 'twitter:description', content: this.defaultDescription },
      { name: 'twitter:image', content: `${this.siteUrl}${this.defaultImage}` }
    ]);

    // Set page title
    this.title.setTitle(this.defaultTitle);
  }

  /**
   * Update SEO data for current page
   */
  updateSEO(seoData: SEOData): void {
    // Update page title
    this.title.setTitle(seoData.title);

    // Update basic meta tags
    this.updateMetaTag('description', seoData.description);
    
    if (seoData.keywords) {
      this.updateMetaTag('keywords', seoData.keywords.join(', '));
    }

    if (seoData.author) {
      this.updateMetaTag('author', seoData.author);
    }

    // Update robots meta tag
    let robotsContent = '';
    if (seoData.noIndex) robotsContent += 'noindex';
    if (seoData.noFollow) {
      robotsContent += robotsContent ? ', nofollow' : 'nofollow';
    }
    if (robotsContent) {
      this.updateMetaTag('robots', robotsContent);
    }

    // Update Open Graph meta tags
    this.updateOGTag('title', seoData.title);
    this.updateOGTag('description', seoData.description);
    this.updateOGTag('image', seoData.image || `${this.siteUrl}${this.defaultImage}`);
    this.updateOGTag('url', seoData.url || `${this.siteUrl}${this.router.url}`);
    this.updateOGTag('type', seoData.type || 'website');
    
    if (seoData.siteName) {
      this.updateOGTag('site_name', seoData.siteName);
    }

    if (seoData.locale) {
      this.updateOGTag('locale', seoData.locale);
    }

    // Update Twitter Card meta tags
    this.updateTwitterTag('title', seoData.title);
    this.updateTwitterTag('description', seoData.description);
    
    if (seoData.image) {
      this.updateTwitterTag('image', seoData.image);
    }

    if (seoData.twitterCard) {
      this.updateTwitterTag('card', seoData.twitterCard);
    }

    if (seoData.twitterSite) {
      this.updateTwitterTag('site', seoData.twitterSite);
    }

    if (seoData.twitterCreator) {
      this.updateTwitterTag('creator', seoData.twitterCreator);
    }

    // Set canonical URL
    if (seoData.canonicalUrl) {
      this.setCanonicalUrl(seoData.canonicalUrl);
    } else {
      this.setCanonicalUrl(`${this.siteUrl}${this.router.url}`);
    }

    // Add custom meta tags
    if (seoData.customMetaTags) {
      this.addCustomMetaTags(seoData.customMetaTags);
    }

    // Add structured data
    if (seoData.structuredData) {
      this.addStructuredData(seoData.structuredData);
    }
  }

  /**
   * Update meta tag
   */
  private updateMetaTag(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  /**
   * Update Open Graph meta tag
   */
  private updateOGTag(property: string, content: string): void {
    this.meta.updateTag({ property: `og:${property}`, content });
  }

  /**
   * Update Twitter meta tag
   */
  private updateTwitterTag(name: string, content: string): void {
    this.meta.updateTag({ name: `twitter:${name}`, content });
  }

  /**
   * Set canonical URL
   */
  private setCanonicalUrl(url: string): void {
    // Remove existing canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Add new canonical link
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    document.head.appendChild(link);
  }

  /**
   * Add custom meta tags
   */
  private addCustomMetaTags(tags: { name: string; content: string }[]): void {
    tags.forEach(tag => {
      this.meta.addTag(tag);
    });
  }

  /**
   * Add structured data (JSON-LD)
   */
  private addStructuredData(structuredData: any): void {
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  /**
   * Set default SEO for page
   */
  setDefaultSEO(): void {
    this.setDefaultMetaTags();
    this.removeStructuredData();
  }

  /**
   * Remove structured data
   */
  private removeStructuredData(): void {
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }
  }

  /**
   * Generate structured data for organization
   */
  generateOrganizationStructuredData(): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'CarCommun',
      'url': this.siteUrl,
      'logo': `${this.siteUrl}/assets/images/logo.png`,
      'description': this.defaultDescription,
      'sameAs': [
        'https://twitter.com/carcommun',
        'https://facebook.com/carcommun',
        'https://linkedin.com/company/carcommun'
      ],
      'contactPoint': {
        '@type': 'ContactPoint',
        'contactType': 'customer service',
        'email': 'support@carcommun.com'
      }
    };
  }

  /**
   * Generate structured data for website
   */
  generateWebsiteStructuredData(): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'CarCommun',
      'url': this.siteUrl,
      'description': this.defaultDescription,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': `${this.siteUrl}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    };
  }

  /**
   * Generate structured data for breadcrumb list
   */
  generateBreadcrumbStructuredData(breadcrumbs: { name: string; url: string }[]): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((breadcrumb, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': breadcrumb.name,
        'item': breadcrumb.url.startsWith('http') ? breadcrumb.url : `${this.siteUrl}${breadcrumb.url}`
      }))
    };
  }

  /**
   * Generate structured data for article
   */
  generateArticleStructuredData(article: {
    headline: string;
    description: string;
    author: string;
    datePublished: string;
    dateModified?: string;
    image?: string;
  }): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': article.headline,
      'description': article.description,
      'author': {
        '@type': 'Person',
        'name': article.author
      },
      'datePublished': article.datePublished,
      'dateModified': article.dateModified || article.datePublished,
      'image': article.image ? `${this.siteUrl}${article.image}` : `${this.siteUrl}${this.defaultImage}`,
      'publisher': {
        '@type': 'Organization',
        'name': 'CarCommun',
        'logo': {
          '@type': 'ImageObject',
          'url': `${this.siteUrl}/assets/images/logo.png`
        }
      }
    };
  }

  /**
   * Generate structured data for product
   */
  generateProductStructuredData(product: {
    name: string;
    description: string;
    brand?: string;
    image?: string;
    offers?: {
      price: string;
      priceCurrency: string;
      availability: string;
      url?: string;
    };
  }): any {
    const structuredData: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': product.name,
      'description': product.description
    };

    if (product.brand) {
      structuredData.brand = {
        '@type': 'Brand',
        'name': product.brand
      };
    }

    if (product.image) {
      structuredData.image = `${this.siteUrl}${product.image}`;
    }

    if (product.offers) {
      structuredData.offers = {
        '@type': 'Offer',
        'price': product.offers.price,
        'priceCurrency': product.offers.priceCurrency,
        'availability': product.offers.availability,
        'url': product.offers.url || `${this.siteUrl}${this.router.url}`
      };
    }

    return structuredData;
  }

  /**
   * Set page as noindex
   */
  setNoIndex(): void {
    this.updateMetaTag('robots', 'noindex, nofollow');
  }

  /**
   * Set page as nofollow
   */
  setNoFollow(): void {
    this.updateMetaTag('robots', 'index, nofollow');
  }

  /**
   * Set page as noindex and nofollow
   */
  setNoIndexNoFollow(): void {
    this.updateMetaTag('robots', 'noindex, nofollow');
  }

  /**
   * Enable indexing and following
   */
  setIndexFollow(): void {
    this.updateMetaTag('robots', 'index, follow');
  }

  /**
   * Add hreflang tags for international SEO
   */
  addHreflangTags(locales: { locale: string; url: string }[]): void {
    // Remove existing hreflang tags
    const existingHreflang = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingHreflang.forEach(tag => tag.remove());

    // Add new hreflang tags
    locales.forEach(locale => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', locale.locale);
      link.setAttribute('href', locale.url.startsWith('http') ? locale.url : `${this.siteUrl}${locale.url}`);
      document.head.appendChild(link);
    });

    // Add x-default hreflang
    const defaultLink = document.createElement('link');
    defaultLink.setAttribute('rel', 'alternate');
    defaultLink.setAttribute('hreflang', 'x-default');
    defaultLink.setAttribute('href', `${this.siteUrl}${this.router.url}`);
    document.head.appendChild(defaultLink);
  }

  /**
   * Add preload link for performance
   */
  addPreload(resource: string, type: string = 'font'): void {
    const link = document.createElement('link');
    link.setAttribute('rel', 'preload');
    link.setAttribute('href', resource);
    link.setAttribute('as', type);
    document.head.appendChild(link);
  }

  /**
   * Add prefetch link for navigation prediction
   */
  addPrefetch(resource: string): void {
    const link = document.createElement('link');
    link.setAttribute('rel', 'prefetch');
    link.setAttribute('href', resource);
    document.head.appendChild(link);
  }

  /**
   * Add DNS prefetch for external resources
   */
  addDnsPrefetch(resource: string): void {
    const link = document.createElement('link');
    link.setAttribute('rel', 'dns-prefetch');
    link.setAttribute('href', resource);
    document.head.appendChild(link);
  }

  /**
   * Generate sitemap URL list
   */
  generateSitemap(urls: string[]): string {
    const sitemap = urls.map(url => {
      return `
  <url>
    <loc>${this.siteUrl}${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap}
</urlset>`;
  }

  /**
   * Track page view for analytics (if needed)
   */
  trackPageView(): void {
    // This would integrate with your analytics service
    console.log('SEO: Page view tracked', {
      url: this.router.url,
      title: this.title.getTitle()
    });
  }

  /**
   * Get current page title
   */
  getCurrentTitle(): string {
    return this.title.getTitle();
  }

  /**
   * Get current meta description
   */
  getCurrentDescription(): string {
    return this.meta.getTag('name=description')?.content || '';
  }

  /**
   * Check if page is indexed
   */
  isIndexed(): boolean {
    const robots = this.meta.getTag('name=robots')?.content || '';
    return !robots.includes('noindex');
  }

  /**
   * Check if page links are followed
   */
  isFollowed(): boolean {
    const robots = this.meta.getTag('name=robots')?.content || '';
    return !robots.includes('nofollow');
  }
}