'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Settings, ShieldCheck, Bell, Palette, Globe, Truck } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

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
        <h1 className="font-['Cinzel'] text-2xl font-bold tracking-widest text-white">SETTINGS</h1>
      </div>

      {/* Shipping Configuration */}
      <form onSubmit={handleSaveShipping} className="glass border border-white/5 p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
          <Truck className="h-4 w-4 text-primary" />
          <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white">Shipping Configuration</h3>
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
              <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white">{group.title}</h3>
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
            <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white">Feature Flags</h3>
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
    </div>
  );
}
