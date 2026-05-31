'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Settings, ShieldCheck, Bell, Palette, Globe, Truck, Phone, Share2 } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

const DEFAULT_SOCIAL = {
  facebook: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  mobile: '',
};

const DEFAULT_SETTINGS = {
  name: 'Glimore Style',
  email: 'support@glimore.style',
  fee: '8',
  session: '5',
  attempts: '5',
  alert_email: 'admin@glimore.style',
  order_email: 'orders@glimore.style',
};

const DEFAULT_FLAGS = {
  vendor_applications: true,
  maintenance_mode: false,
  whatsapp_notifications: true,
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [flags, setFlags] = useState(DEFAULT_FLAGS);

  const [shippingAmount, setShippingAmount] = useState<number>(0);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [shippingSaved, setShippingSaved] = useState(false);

  const [social, setSocial] = useState(DEFAULT_SOCIAL);
  const [socialLoading, setSocialLoading] = useState(true);
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialSaved, setSocialSaved] = useState(false);

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    getDoc(doc(db, 'settings', 'general')).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          name: data.name ?? DEFAULT_SETTINGS.name,
          email: data.email ?? DEFAULT_SETTINGS.email,
          fee: data.fee ?? DEFAULT_SETTINGS.fee,
          session: data.session ?? DEFAULT_SETTINGS.session,
          attempts: data.attempts ?? DEFAULT_SETTINGS.attempts,
          alert_email: data.alert_email ?? DEFAULT_SETTINGS.alert_email,
          order_email: data.order_email ?? DEFAULT_SETTINGS.order_email,
          

        });
        setFlags({
          vendor_applications: data.vendor_applications ?? DEFAULT_FLAGS.vendor_applications,
          maintenance_mode: data.maintenance_mode ?? DEFAULT_FLAGS.maintenance_mode,
          whatsapp_notifications: data.whatsapp_notifications ?? DEFAULT_FLAGS.whatsapp_notifications,
        });
      }
    }).finally(() => setConfigLoading(false));

    getDoc(doc(db, 'settings', 'shipping')).then((snap) => {
      if (snap.exists()) setShippingAmount(snap.data().amount ?? 0);
    }).finally(() => setShippingLoading(false));

    getDoc(doc(db, 'settings', 'social')).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setSocial({
          facebook: d.facebook ?? '',
          instagram: d.instagram ?? '',
          linkedin: d.linkedin ?? '',
          youtube: d.youtube ?? '',
          mobile: d.mobile ?? '',
        });
      }
    }).finally(() => setSocialLoading(false));
  }, [user]);

  if (loading || !user || user.role !== 'admin') {
    return <div className="min-h-96 flex items-center justify-center"><p className="text-zinc-500 text-xs">Verifying access...</p></div>;
  }

  const handleSaveConfig = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConfigSaving(true);
    await setDoc(doc(db, 'settings', 'general'), { ...settings, ...flags, updatedAt: serverTimestamp() });
    setConfigSaving(false);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const handleSaveShipping = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShippingSaving(true);
    await setDoc(doc(db, 'settings', 'shipping'), { amount: shippingAmount, updatedAt: serverTimestamp() });
    setShippingSaving(false);
    setShippingSaved(true);
    setTimeout(() => setShippingSaved(false), 3000);
  };

  const handleSaveSocial = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSocialSaving(true);
    await setDoc(doc(db, 'settings', 'social'), { ...social, updatedAt: serverTimestamp() });
    setSocialSaving(false);
    setSocialSaved(true);
    setTimeout(() => setSocialSaved(false), 3000);
  };

  const settingGroups = [
    {
      icon: Globe,
      title: 'Platform',
      fields: [
        { label: 'Platform Name', type: 'text', key: 'name' as const },
        { label: 'Support Email', type: 'email', key: 'email' as const },
        { label: 'Platform Fee (%)', type: 'number', key: 'fee' as const },
      ],
    },
    {
      icon: ShieldCheck,
      title: 'Security',
      fields: [
        { label: 'Session Duration (days)', type: 'number', key: 'session' as const },
        { label: 'Max Login Attempts', type: 'number', key: 'attempts' as const },
      ],
    },
    {
      icon: Bell,
      title: 'Notifications',
      fields: [
        { label: 'Admin Alert Email', type: 'email', key: 'alert_email' as const },
        { label: 'Order Notification Email', type: 'email', key: 'order_email' as const },
      ],
    },
  ];

  const toggleDefs = [
    { key: 'vendor_applications' as const, label: 'Vendor Applications Open', description: 'Allow new vendors to apply to join the platform' },
    { key: 'maintenance_mode' as const, label: 'Maintenance Mode', description: 'Display a maintenance page to all non-admin visitors' },
    { key: 'whatsapp_notifications' as const, label: 'WhatsApp Order Notifications', description: 'Send order details via WhatsApp to operations team' },
  ];

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-8">

      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1 mb-1">
          <Settings className="h-3.5 w-3.5" /> Platform Configuration
        </span>
        <h1 className="font-['Montserrat'] text-2xl font-bold tracking-widest text-white">SETTINGS</h1>
      </div>

      {/* Shipping Configuration */}
      <form onSubmit={handleSaveShipping} className="glass border border-white/5 p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
          <Truck className="h-4 w-4 text-primary" />
          <h3 className="font-['Montserrat'] text-sm font-semibold tracking-wider text-white">Shipping Configuration</h3>
        </div>

        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Set the flat shipping fee applied at checkout. Enter <strong className="text-zinc-300">0</strong> for free / complimentary shipping.
        </p>

        <div className="flex items-end gap-4">
          <div className="space-y-1.5 flex-1 max-w-xs">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">
              Shipping Charge (BDT)
            </label>
            {shippingLoading ? (
              <div className="h-9 bg-white/5 animate-pulse" />
            ) : (
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500 text-xs">৳</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={shippingAmount}
                  onChange={(e) => setShippingAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-black border border-white/10 pl-6 pr-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold block">Preview</span>
            <span className={`text-xs font-semibold px-3 py-2 border block text-center ${
              shippingAmount === 0
                ? 'text-green-400 border-green-500/20 bg-green-500/5'
                : 'text-primary border-primary/20 bg-primary/5'
            }`}>
              {shippingAmount === 0 ? 'Complimentary' : `৳${shippingAmount.toFixed(2)}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1">
          <button
            type="submit"
            disabled={shippingSaving || shippingLoading}
            className="px-6 py-2.5 bg-primary text-black font-semibold text-xs tracking-[0.15em] uppercase hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {shippingSaving ? 'Saving…' : 'Save Shipping'}
          </button>
          {shippingSaved && (
            <span className="text-green-400 text-xs font-semibold tracking-wider animate-fadeIn">
              ✓ Shipping rate updated
            </span>
          )}
        </div>
      </form>

      {/* Platform / Security / Notifications + Feature Flags */}
      <form onSubmit={handleSaveConfig} className="space-y-6">
        {settingGroups.map((group) => (
          <div key={group.title} className="glass border border-white/5 p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <group.icon className="h-4 w-4 text-primary" />
              <h3 className="font-['Montserrat'] text-sm font-semibold tracking-wider text-white">{group.title}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">
                    {field.label}
                  </label>
                  {configLoading ? (
                    <div className="h-9 bg-white/5 animate-pulse" />
                  ) : (
                    <input
                      type={field.type}
                      value={settings[field.key]}
                      onChange={(e) => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full bg-black border border-white/10 px-3.5 py-2 text-xs focus:outline-none focus:border-primary text-white"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Feature Flags */}
        <div className="glass border border-white/5 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="font-['Montserrat'] text-sm font-semibold tracking-wider text-white">Feature Flags</h3>
          </div>
          <div className="space-y-4">
            {toggleDefs.map((toggle) => (
              <div key={toggle.key} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-white font-medium">{toggle.label}</p>
                  <p className="text-[10px] text-zinc-500 font-light mt-0.5">{toggle.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={flags[toggle.key]}
                    onChange={(e) => setFlags(prev => ({ ...prev, [toggle.key]: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:bg-primary/70 transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={configSaving || configLoading}
            className="px-6 py-3 bg-primary text-black font-semibold text-xs tracking-[0.15em] uppercase hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {configSaving ? 'Saving…' : 'Save Configuration'}
          </button>
          {configSaved && (
            <span className="text-green-400 text-xs font-semibold tracking-wider animate-fadeIn">
              ✓ Settings saved successfully
            </span>
          )}
        </div>
      </form>

      {/* Social Media & Contact */}
      <form onSubmit={handleSaveSocial} className="glass border border-white/5 p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
          <Share2 className="h-4 w-4 text-primary" />
          <h3 className="font-['Montserrat'] text-sm font-semibold tracking-wider text-white">Social Media &amp; Contact</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Facebook */}
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold flex items-center gap-1.5">
              <svg className="w-3 h-3 fill-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
              Facebook
            </label>
            {socialLoading ? <div className="h-9 bg-white/5 animate-pulse" /> : (
              <input
                type="url"
                placeholder="https://facebook.com/yourpage"
                value={social.facebook}
                onChange={(e) => setSocial(p => ({ ...p, facebook: e.target.value }))}
                className="w-full bg-black border border-white/10 px-3.5 py-2 text-xs focus:outline-none focus:border-primary text-white placeholder:text-zinc-700"
              />
            )}
          </div>

          {/* Instagram */}
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold flex items-center gap-1.5">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="url(#ig)">
                <defs>
                  <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f09433"/>
                    <stop offset="25%" stopColor="#e6683c"/>
                    <stop offset="50%" stopColor="#dc2743"/>
                    <stop offset="75%" stopColor="#cc2366"/>
                    <stop offset="100%" stopColor="#bc1888"/>
                  </linearGradient>
                </defs>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Instagram
            </label>
            {socialLoading ? <div className="h-9 bg-white/5 animate-pulse" /> : (
              <input
                type="text"
                placeholder="@yourhandle"
                value={social.instagram}
                onChange={(e) => setSocial(p => ({ ...p, instagram: e.target.value }))}
                className="w-full bg-black border border-white/10 px-3.5 py-2 text-xs focus:outline-none focus:border-primary text-white placeholder:text-zinc-700"
              />
            )}
          </div>

          {/* LinkedIn */}
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold flex items-center gap-1.5">
              <svg className="w-3 h-3 fill-[#0A66C2]" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </label>
            {socialLoading ? <div className="h-9 bg-white/5 animate-pulse" /> : (
              <input
                type="url"
                placeholder="https://linkedin.com/company/yourpage"
                value={social.linkedin}
                onChange={(e) => setSocial(p => ({ ...p, linkedin: e.target.value }))}
                className="w-full bg-black border border-white/10 px-3.5 py-2 text-xs focus:outline-none focus:border-primary text-white placeholder:text-zinc-700"
              />
            )}
          </div>

          {/* YouTube */}
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold flex items-center gap-1.5">
              <svg className="w-3 h-3 fill-[#FF0000]" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              YouTube
            </label>
            {socialLoading ? <div className="h-9 bg-white/5 animate-pulse" /> : (
              <input
                type="url"
                placeholder="https://youtube.com/@yourchannel"
                value={social.youtube}
                onChange={(e) => setSocial(p => ({ ...p, youtube: e.target.value }))}
                className="w-full bg-black border border-white/10 px-3.5 py-2 text-xs focus:outline-none focus:border-primary text-white placeholder:text-zinc-700"
              />
            )}
          </div>

          {/* Mobile */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-green-400" />
              Mobile / WhatsApp Number
            </label>
            {socialLoading ? <div className="h-9 bg-white/5 animate-pulse" /> : (
              <input
                type="tel"
                placeholder="+880 1700 000000"
                value={social.mobile}
                onChange={(e) => setSocial(p => ({ ...p, mobile: e.target.value }))}
                className="w-full bg-black border border-white/10 px-3.5 py-2 text-xs focus:outline-none focus:border-primary text-white placeholder:text-zinc-700"
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1">
          <button
            type="submit"
            disabled={socialSaving || socialLoading}
            className="px-6 py-2.5 bg-primary text-black font-semibold text-xs tracking-[0.15em] uppercase hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {socialSaving ? 'Saving…' : 'Save Social Links'}
          </button>
          {socialSaved && (
            <span className="text-green-400 text-xs font-semibold tracking-wider animate-fadeIn">
              ✓ Social links updated
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
