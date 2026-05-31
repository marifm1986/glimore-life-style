'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import Image from 'next/image';
import { Phone } from 'lucide-react';

interface SocialSettings {
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  mobile: string;
}

// Inline SVG brand icons — lucide-react doesn't include these
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const SOCIAL_LINKS: {
  key: keyof Omit<SocialSettings, 'mobile'>;
  Icon: ({ className }: { className?: string }) => React.ReactElement;
  label: string;
  hoverColor: string;
}[] = [
  { key: 'facebook',  Icon: FacebookIcon,  label: 'Facebook',  hoverColor: 'hover:text-[#1877F2]' },
  { key: 'instagram', Icon: InstagramIcon, label: 'Instagram', hoverColor: 'hover:text-[#E1306C]' },
  { key: 'linkedin',  Icon: LinkedInIcon,  label: 'LinkedIn',  hoverColor: 'hover:text-[#0A66C2]' },
  { key: 'youtube',   Icon: YouTubeIcon,   label: 'YouTube',   hoverColor: 'hover:text-[#FF0000]' },
];

export default function Footer() {
  const [categories, setCategories] = useState<string[]>([]);
  const [social, setSocial] = useState<SocialSettings>({ facebook: '', instagram: '', linkedin: '', youtube: '', mobile: '' });

  useEffect(() => {
    getDocs(collection(db, 'inventory')).then((snap) => {
      const unique = Array.from(new Set(snap.docs.map(d => d.data().category).filter(Boolean))) as string[];
      setCategories(unique.slice(0, 6));
    });

    getDoc(doc(db, 'settings', 'social')).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setSocial({
          facebook:  d.facebook  ?? '',
          instagram: d.instagram ?? '',
          linkedin:  d.linkedin  ?? '',
          youtube:   d.youtube   ?? '',
          mobile:    d.mobile    ?? '',
        });
      }
    });
  }, []);

  const activeSocials = SOCIAL_LINKS.filter(({ key }) => !!social[key]);

  return (
    <footer className="bg-[#050507] border-t border-white/5 text-zinc-500 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand column */}
        <div className="space-y-4">
          <Image src="/logo.webp" alt="GLIMORE LIFE STYLE Logo" width={120} height={120} className="object-contain rounded-md overflow-hidden" />
          <p className="text-zinc-600 leading-relaxed text-xs">
            A premium collective of elite independent fashion houses, artisans, and avant-garde designers producing sustainable, ethical, and high-fashion statement pieces.
          </p>

          {/* Social icons */}
          {activeSocials.length > 0 && (
            <div className="pt-1">
              <p className="text-[12px] tracking-[0.25em] uppercase text-zinc-700 font-semibold mb-3">Follow Us</p>
              <div className="flex items-center gap-3">
                {activeSocials.map(({ key, Icon, label, hoverColor }) => {
                  const href = key === 'instagram' && !social[key].startsWith('http')
                    ? `https://instagram.com/${social[key].replace('@', '')}`
                    : social[key];
                  return (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className={`text-zinc-600 ${hoverColor} transition-colors duration-200`}
                    >
                      <Icon className="w-6 h-6" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Collections — real data */}
        <nav aria-label="Product collections">
          <h4 className="text-white font-['Montserrat'] tracking-widest text-xs uppercase mb-4 font-semibold">Collections</h4>
          <ul className="space-y-2 text-xs">
            {categories.length === 0 ? (
              <li className="text-zinc-700" aria-live="polite">Loading...</li>
            ) : (
              categories.map((cat) => (
                <li key={cat}>
                  <Link href={`/products?category=${encodeURIComponent(cat)}`} className="hover:text-primary transition-colors">
                    {cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </nav>

        {/* Service */}
        <nav aria-label="Service links">
          <h4 className="text-white font-['Montserrat'] tracking-widest text-xs uppercase mb-4 font-semibold">Service</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/products" className="hover:text-primary transition-colors">Shipping &amp; Returns</Link></li>
            <li><Link href="/products" className="hover:text-primary transition-colors">Sizing Consultations</Link></li>
            <li><Link href="/products" className="hover:text-primary transition-colors">Stripe Connect Portals</Link></li>
            <li><Link href="/products" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
          </ul>
        </nav>

   
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 py-5 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] tracking-widest uppercase text-zinc-700" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} GLIMORE LIFE STYLE. All Rights Reserved.
          </p>
          {social.mobile && (
            <a
              href={`tel:${social.mobile.replace(/\s/g, '')}`}
              className="flex items-center gap-1.5 text-[10px] tracking-wider text-zinc-600 hover:text-primary transition-colors"
            >
              <Phone className="h-3 w-3" />
              {social.mobile}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
