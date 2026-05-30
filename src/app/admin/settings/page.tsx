'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Settings, ShieldCheck, Bell, Palette, Globe, AlertTriangle } from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'admin') {
    return <div className="min-h-96 flex items-center justify-center"><p className="text-zinc-500 text-xs">Verifying access...</p></div>;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const settingGroups = [
    {
      icon: Globe,
      title: 'Platform',
      fields: [
        { label: 'Platform Name', type: 'text', defaultValue: 'Glimore Style', key: 'name' },
        { label: 'Support Email', type: 'email', defaultValue: 'support@glimore.style', key: 'email' },
        { label: 'Platform Fee (%)', type: 'number', defaultValue: '8', key: 'fee' },
      ],
    },
    {
      icon: ShieldCheck,
      title: 'Security',
      fields: [
        { label: 'Session Duration (days)', type: 'number', defaultValue: '5', key: 'session' },
        { label: 'Max Login Attempts', type: 'number', defaultValue: '5', key: 'attempts' },
      ],
    },
    {
      icon: Bell,
      title: 'Notifications',
      fields: [
        { label: 'Admin Alert Email', type: 'email', defaultValue: 'admin@glimore.style', key: 'alert_email' },
        { label: 'Order Notification Email', type: 'email', defaultValue: 'orders@glimore.style', key: 'order_email' },
      ],
    },
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

      {/* Notice */}
      <div className="p-4 border border-amber-500/15 bg-amber-500/5 text-amber-400 text-xs flex gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>Settings in this panel are for demonstration purposes. Connect your environment variables and Firebase project to persist real configuration changes.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
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
                  <input
                    type={field.type}
                    defaultValue={field.defaultValue}
                    className="w-full bg-black border border-white/10 px-3.5 py-2 text-xs focus:outline-none focus:border-primary text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Toggles */}
        <div className="glass border border-white/5 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white">Feature Flags</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Vendor Applications Open', description: 'Allow new vendors to apply to join the platform', defaultOn: true },
              { label: 'Maintenance Mode', description: 'Display a maintenance page to all non-admin visitors', defaultOn: false },
              { label: 'WhatsApp Order Notifications', description: 'Send order details via WhatsApp to operations team', defaultOn: true },
            ].map((toggle) => (
              <div key={toggle.label} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-white font-medium">{toggle.label}</p>
                  <p className="text-[10px] text-zinc-500 font-light mt-0.5">{toggle.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input type="checkbox" defaultChecked={toggle.defaultOn} className="sr-only peer" />
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:bg-primary/70 transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="px-6 py-3 bg-primary text-black font-semibold text-xs tracking-[0.15em] uppercase hover:bg-opacity-90 transition-all"
          >
            Save Configuration
          </button>
          {saved && (
            <span className="text-green-400 text-xs font-semibold tracking-wider animate-fadeIn">
              ✓ Settings saved successfully
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
