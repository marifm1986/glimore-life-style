import webpush from 'web-push';
import { dbAdmin } from '@/config/firebase-admin';

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@glimore.style'}`,
    pub,
    priv,
  );
  vapidConfigured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

export async function notifyAdmins(payload: PushPayload): Promise<void> {
  if (!ensureVapid()) {
    console.warn('[push] VAPID keys not configured — skipping notification');
    return;
  }

  const snap = await dbAdmin.collection('push_subscriptions').get();
  if (snap.empty) return;

  const results = await Promise.allSettled(
    snap.docs.map((d) =>
      webpush.sendNotification(
        d.data().subscription as webpush.PushSubscription,
        JSON.stringify({ icon: '/only_logo.webp', ...payload }),
      )
    )
  );

  // Prune stale subscriptions (410 Gone / 404 Not Found)
  await Promise.all(
    snap.docs
      .filter((_, i) => {
        const r = results[i];
        if (r.status !== 'rejected') return false;
        const code = (r.reason as any)?.statusCode;
        return code === 410 || code === 404;
      })
      .map((d) => d.ref.delete())
  );
}
