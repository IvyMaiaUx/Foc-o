export function articleJsonLd(a: {
  title: string; description: string; url: string; image: string;
  publicadoEm: Date; atualizadoEm: Date; autoraNome: string; autoraUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    image: a.image,
    mainEntityOfPage: { '@type': 'WebPage', '@id': a.url },
    datePublished: a.publicadoEm.toISOString(),
    dateModified: a.atualizadoEm.toISOString(),
    author: { '@type': 'Person', name: a.autoraNome, url: a.autoraUrl },
    publisher: {
      '@type': 'Organization',
      name: 'Focão',
      logo: { '@type': 'ImageObject', url: 'https://focaoapp.com.br/favicon-32x32.png' },
    },
  } as const;
}

export function breadcrumbJsonLd(itens: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function personJsonLd(p: { name: string; url: string; jobTitle: string; image?: string; description?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    url: p.url,
    jobTitle: p.jobTitle,
    ...(p.image ? { image: p.image } : {}),
    ...(p.description ? { description: p.description } : {}),
  };
}
