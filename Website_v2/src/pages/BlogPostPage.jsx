import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Tag, ChevronRight, ArrowLeft, ArrowRight, Share2, Facebook, Twitter, MessageCircle, BarChart2, CheckCircle2 } from 'lucide-react';
import SEO from '../components/SEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getPostBySlug, getRelatedPosts, formatDate } from '../data/blogPosts';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';

// ─── Category colors (mirrored from BlogPage) ────────────────────────────────

const CATEGORY_COLORS = {
  peternak: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  broker: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  sembako: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  umum: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
};

// ─── Related Post Card ─────────────────────────────────────────────────────────

function RelatedCard({ post }) {
  const cat = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.umum;
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex gap-4 items-start bg-[#0C1319] rounded-2xl p-5 border border-white/8 hover:border-emerald-500/25 transition-all"
    >
      <div className="flex-1 min-w-0">
        <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${cat.bg} ${cat.text}`}>
          {post.category}
        </span>
        <p className="text-[#F1F5F9] text-sm font-semibold leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {post.title}
        </p>
        <p className="text-[#4B6478] text-xs mt-1 flex items-center gap-1">
          <Clock size={9} /> {post.readTime} menit
        </p>
      </div>
      <ArrowRight size={16} className="text-[#4B6478] group-hover:text-emerald-400 transition-colors shrink-0 mt-1" />
    </Link>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);
  const { data: cfg = {} } = useSiteConfig();

  // Redirect 404 → /blog
  if (!post) return <Navigate to="/blog" replace />;

  const cat = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.umum;
  const related = getRelatedPosts(post.relatedSlugs ?? []);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://ternakos.my.id/blog/${post.slug}`
    },
    "headline": post.title,
    "description": post.metaDescription,
    "image": post.image ? `https://ternakos.my.id${post.image}` : (cfg.company_logo_url ?? "https://ternakos.my.id/logo.png"),  
    "author": {
      "@type": "Organization",
      "name": cfg.company_name ?? "TernakOS",
      "url": cfg.company_url ?? "https://ternakos.my.id"
    },  
    "publisher": {
      "@type": "Organization",
      "name": cfg.company_name ?? "TernakOS",
      "logo": {
        "@type": "ImageObject",
        "url": cfg.company_logo_url ?? "https://ternakos.my.id/logo.png"
      }
    },
    "datePublished": post.date || "2026-04-20"
  };

  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <SEO
        title={`${post.title} - Blog TernakOS`}
        description={post.metaDescription}
        path={`/blog/${post.slug}`}
        type="article"
        schema={articleSchema}
      />
      <Navbar />

      <main className="pt-20">
        {/* HERO IMAGE (if available) */}
        {post.image && (
          <div className="w-full h-[280px] md:h-[420px] overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="max-w-3xl mx-auto px-6 py-12">

          {/* BREADCRUMB */}
          <nav className="flex items-center gap-1.5 text-xs text-[#4B6478] mb-8 flex-wrap">
            <Link to="/" className="hover:text-white transition-colors">Beranda</Link>
            <ChevronRight size={12} />
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            <ChevronRight size={12} />
            <span className="text-[#94A3B8] truncate max-w-[200px]">{post.title}</span>
          </nav>

          {/* ARTICLE HEADER */}
          <motion.header
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            {/* Category badge */}
            <div className="mb-4">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
                <Tag size={9} />
                {post.category}
              </span>
            </div>

            {/* Title H1 */}
            <h1 className="font-display text-3xl md:text-4xl font-black text-white leading-tight tracking-tight mb-5">
              {post.title}
            </h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#4B6478] pb-6 border-b border-white/8">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {post.readTime} menit baca
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(post.tags ?? []).slice(0, 3).map(tag => (
                  <span key={tag} className="bg-white/5 text-[#94A3B8] text-[10px] px-2 py-0.5 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.header>

          {/* ARTICLE BODY — prose styling */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="prose prose-invert prose-emerald max-w-none
              prose-headings:font-display prose-headings:font-bold
              prose-h2:text-emerald-400 prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-white prose-h3:text-lg prose-h3:mt-7 prose-h3:mb-3
              prose-p:text-[#94A3B8] prose-p:leading-[1.85] prose-p:my-4
              prose-li:text-[#94A3B8] prose-li:leading-relaxed
              prose-strong:text-white
              prose-table:text-sm prose-th:text-[#F1F5F9] prose-th:font-bold prose-td:text-[#94A3B8]
              prose-table:border-collapse prose-th:border prose-th:border-white/10 prose-th:p-3 prose-td:border prose-td:border-white/8 prose-td:p-3
              prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-500/5 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:my-6 prose-blockquote:not-italic prose-blockquote:text-[#F1F5F9]
              [&_.blog-cta]:bg-emerald-500/8 [&_.blog-cta]:border [&_.blog-cta]:border-emerald-500/20 [&_.blog-cta]:rounded-2xl [&_.blog-cta]:p-6 [&_.blog-cta]:mt-12
              [&_.blog-cta_p]:text-[#F1F5F9] [&_.blog-cta_p]:my-0 [&_.blog-cta_p]:mb-3
              [&_.blog-cta_a]:inline-flex [&_.blog-cta_a]:items-center [&_.blog-cta_a]:gap-1 [&_.blog-cta_a]:bg-emerald-500 [&_.blog-cta_a]:hover:bg-emerald-400 [&_.blog-cta_a]:text-white [&_.blog-cta_a]:font-bold [&_.blog-cta_a]:px-5 [&_.blog-cta_a]:py-2.5 [&_.blog-cta_a]:rounded-xl [&_.blog-cta_a]:no-underline [&_.blog-cta_a]:transition-colors [&_.blog-cta_a]:text-sm"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* RELATED POSTS */}
          {related.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-16 pt-10 border-t border-white/8"
            >
              <h2 className="text-xl font-bold text-white mb-5">Artikel Terkait</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map(rel => <RelatedCard key={rel.slug} post={rel} />)}
              </div>
            </motion.section>
          )}

          {/* BACK TO BLOG */}
          <div className="mt-12">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-[#4B6478] hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              Kembali ke Blog
            </Link>
          </div>
        </div>
      </main>

      {/* STICKY CTA MOBILE */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0C1319]/95 backdrop-blur-xl border-t border-white/8 px-4 py-3 flex items-center gap-3">
        <p className="text-xs text-[#94A3B8] flex-1">Kelola kandang lebih mudah dengan TernakOS</p>
        <Link
          to="/register"
          className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
        >
          Coba Gratis →
        </Link>
      </div>

      <div className="pb-20 md:pb-0">
        <Footer />
      </div>
    </div>
  );
}
