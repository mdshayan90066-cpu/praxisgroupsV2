import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export default function SEO({ title, description, ogTitle, ogDescription }: SEOProps) {
  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    if (description) {
      setMeta('description', description);
      setMeta('og:description', ogDescription ?? description, 'property');
    }
    setMeta('og:title', ogTitle ?? title, 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', ogTitle ?? title);
    if (description) setMeta('twitter:description', description);
  }, [title, description, ogTitle, ogDescription]);

  return null;
}
