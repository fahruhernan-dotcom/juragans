import React from 'react';
import { Head } from 'vite-react-ssg';

const BASE_URL = 'https://ternakos.my.id';

/**
 * SEO Component — Menggunakan <Head> bawaan vite-react-ssg agar
 * title & meta tag di-bake ke dalam HTML statis saat build (SSG).
 *
 * react-helmet-async TIDAK terintegrasi dengan SSG renderer,
 * sehingga title dari index.html yang selalu muncul di Google.
 * Solusinya adalah menggunakan <Head> dari vite-react-ssg.
 *
 * @param {string} title       - Judul halaman unik
 * @param {string} description - Meta description unik per halaman
 * @param {string} path        - URL path, e.g. '/harga' atau '/blog/slug-artikel'
 * @param {string} [type]      - OG type: 'website' atau 'article'
 * @param {string} [image]     - URL gambar OG (opsional)
 */
const SEO = ({ title, description, path, type = 'website', image, schema }) => {
  const canonicalUrl = `${BASE_URL}${path}`;
  const ogImage = image || `${BASE_URL}/logo.png`;

  return (
    <Head>
      {/* ── JSON-LD Structured Data ──────────────────────────────── */}
      {schema && (
        <script type="application/ld+json" id="json-ld-schema" suppressHydrationWarning>
          {JSON.stringify(schema)}
        </script>
      )}

      {/* ── Title ────────────────────────────────────────────────── */}
      <title>{title}</title>
      <meta name="title" content={title} />

      {/* ── Meta Description ─────────────────────────────────────── */}
      <meta name="description" content={description} />

      {/* ── Canonical URL ────────────────────────────────────────── */}
      <link rel="canonical" href={canonicalUrl} />

      {/* ── Open Graph ───────────────────────────────────────────── */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="TernakOS" />
      <meta property="og:locale" content="id_ID" />

      {/* ── Twitter Card ─────────────────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
};

export default SEO;
