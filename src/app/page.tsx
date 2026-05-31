"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Compass,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop";

interface FeaturedProduct {
  id: string;
  productName: string;
  category: string;
  price: number;
  image: string;
  collection: string;
}

export default function HomePage() {
  const [featured, setFeatured] = useState<FeaturedProduct[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "inventory"),
      where("isFeatured", "==", true),
    );
    const unsub = onSnapshot(q, (snap) => {
      setFeatured(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FeaturedProduct),
      );
      setFeaturedLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (featured.length < 2) return;
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featured.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [featured]);

  const goTo = (idx: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrentSlide(idx);
    if (featured.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featured.length);
      }, 5000);
    }
  };

  const hasSlides = !featuredLoading && featured.length > 0;
  const currentItem = hasSlides ? featured[currentSlide] : null;

  return (
    <div className="w-full relative bg-background pb-20">
      {/* HERO */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        {/* Slideshow backgrounds */}
        {hasSlides ? (
          featured.map((item, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.id}
              src={item.image}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 w-full h-full object-cover object-center brightness-[0.35] transition-opacity duration-1000 ${i === currentSlide ? "opacity-100" : "opacity-0"}`}
            />
          ))
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-[0.35]"
            style={{ backgroundImage: `url("${FALLBACK_IMAGE}")` }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0" />

        {/* Hero text */}
        <div className="relative z-10 text-center max-w-4xl px-6 space-y-8 animate-fadeIn">
          <h1 className="font-['Montserrat'] text-4xl sm:text-6xl md:text-7xl font-bold tracking-[0.15em] text-white leading-tight">
            PREMIUM <br />
            <span className="gold-text">COLLECTION</span>
          </h1>
          <p className="text-zinc-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed tracking-wider font-light">
            Timeless fashion and accessories crafted to complement your unique style.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              href="/products"
              className="px-8 py-3.5 bg-primary text-black font-semibold text-xs tracking-[0.2em] uppercase hover:bg-opacity-95 transition-all duration-300 dark-gold-border rounded-none flex items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" /> Explore Collection
            </Link>
          </div>
        </div>

        {/* Current product info — bottom left */}
        {currentItem && (
          <div className="absolute bottom-12 left-8 z-10 max-w-xs">
            <Link href={`/products/${currentItem.id}`} className="group block">
              <span className="text-[9px] tracking-widest uppercase text-primary font-semibold">
                {currentItem.category}
              </span>
              <p className="font-['Montserrat'] text-white text-sm font-semibold tracking-wide leading-tight group-hover:text-primary transition-colors line-clamp-1 mt-0.5">
                {currentItem.productName}
              </p>
              {/* <p className="text-primary text-xs font-semibold mt-1">
                {formatPrice(currentItem.price)}
              </p> */}
            </Link>
          </div>
        )}

        {/* Arrow controls */}
        {hasSlides && featured.length > 1 && (
          <>
            <button
              onClick={() =>
                goTo((currentSlide - 1 + featured.length) % featured.length)
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/40 border border-white/10 text-white hover:border-primary hover:text-primary transition-all backdrop-blur-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => goTo((currentSlide + 1) % featured.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/40 border border-white/10 text-white hover:border-primary hover:text-primary transition-all backdrop-blur-sm"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {hasSlides && featured.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 transition-all duration-300 ${i === currentSlide ? "w-6 bg-primary" : "w-1.5 bg-white/30 hover:bg-white/60"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* FEATURED COLLECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center space-y-4 mb-16">
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold">
            Exquisite Additions
          </span>
          <h2 className="font-['Montserrat'] text-3xl sm:text-4xl font-bold tracking-widest text-white">
            THE RUNWAY PIECES
          </h2>
          <div className="h-px w-24 bg-primary mx-auto opacity-40 mt-4" />
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="glass border border-white/5 animate-pulse"
              >
                <div className="aspect-[3/4] bg-white/5" />
                <div className="p-5 space-y-2">
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="glass p-12 text-center border border-white/5">
            <p className="text-zinc-500 text-xs font-light">
              No featured products yet. Mark items as featured in the admin
              panel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.id}`}
                className="group flex flex-col glass border border-white/5 transition-all duration-300 hover:transform hover:-translate-y-2 dark-gold-border text-left"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110 brightness-[0.9]"
                    loading="lazy"
                  />
                  <span className="absolute top-4 left-4 bg-black/60 text-primary text-[10px] tracking-widest uppercase px-2.5 py-1 backdrop-blur-sm border border-primary/20">
                    {item.category}
                  </span>
                </div>

                <div className="p-5 grow flex flex-col justify-between space-y-3 bg-[#0a0a0d]">
                  <div className="space-y-1">
                    <span className="text-[9px] tracking-wider text-zinc-500 uppercase">
                      {item.collection}
                    </span>
                    <h3 className="font-['Montserrat'] text-sm font-semibold text-white group-hover:text-primary transition-colors tracking-wide leading-tight line-clamp-1">
                      {item.productName}
                    </h3>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-xs font-semibold text-primary">
                      {formatPrice(item.price * 100)}
                    </span>
                    <span className="text-[10px] text-zinc-500 group-hover:text-white group-hover:underline transition-all tracking-wider uppercase font-medium">
                      View Details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center pt-16">
          <Link
            href="/products"
            className="px-10 py-4 border border-primary text-primary hover:bg-primary hover:text-black font-semibold text-xs tracking-[0.2em] uppercase transition-all duration-300 rounded-none inline-block"
          >
            Browse Full Catalog
          </Link>
        </div>
      </section>

      {/* VALUE PROPOSITIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="glass p-8 text-center border border-white/5 flex flex-col items-center space-y-4">
            <div className="p-3.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-['Montserrat'] text-lg font-semibold tracking-wider text-white">
              Verified Authenticity
            </h3>
            <p className="text-zinc-500 text-xs leading-relaxed font-light">
              Every single product in our boutique undergoes rigorous
              verification by industry specialists to promise genuine designer
              craftsmanship.
            </p>
          </div>

          <div className="glass p-8 text-center border border-white/5 flex flex-col items-center space-y-4">
            <div className="p-3.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="font-['Montserrat'] text-lg font-semibold tracking-wider text-white">
              Split Vendor Checkout
            </h3>
            <p className="text-zinc-500 text-xs leading-relaxed font-light">
              Buy from multiple global brands in a single purchase. Our Stripe
              Connect architecture splits payouts and coordinates fulfillment
              securely.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
