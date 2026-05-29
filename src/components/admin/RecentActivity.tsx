'use client';

import { ChevronRight } from 'lucide-react';

interface ActivityItem {
  id: string;
  client: string;
  item: string;
  status: 'delivered' | 'in-transit' | 'processing';
  value: string;
  time: string;
}

const RECENT_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    client: 'Elizabeth Harrington',
    item: 'Celestial Emerald Necklace',
    status: 'delivered',
    value: '৳142,600',
    time: '2 hours ago',
  },
  {
    id: '2',
    client: 'Maximilian Kross',
    item: 'Chrono Midnight Edition',
    status: 'in-transit',
    value: '৳84,500',
    time: '4 hours ago',
  },
  {
    id: '3',
    client: 'Sienna Wirth',
    item: 'Bespoke Engagement Ring',
    status: 'processing',
    value: '৳32,800',
    time: 'Yesterday',
  },
];

export default function RecentActivity() {
  const getStatusBadge = (status: string) => {
    const styles = {
      delivered: 'bg-green-100 text-green-800',
      'in-transit': 'bg-amber-100 text-amber-800',
      processing: 'bg-blue-100 text-blue-800',
    };
    return styles[status as keyof typeof styles];
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-gray-900">Recent High Value Activity</h3>
        <button className="text-gray-600 hover:text-gray-900 text-xs font-medium">
          VIEW ALL ACTIVITY
        </button>
      </div>

      <div className="space-y-4">
        {RECENT_ACTIVITIES.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white font-semibold text-sm">
                  {activity.client
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.client}
                  </p>
                  <p className="text-xs text-gray-500">{activity.item}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 text-xs font-medium rounded ${getStatusBadge(
                  activity.status
                )}`}
              >
                {getStatusLabel(activity.status)}
              </span>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {activity.value}
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-400 group-hover:text-gray-600 transition-colors"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
