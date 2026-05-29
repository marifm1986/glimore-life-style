interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
}

export default function MetricCard({
  icon,
  label,
  value,
  change,
  changeType = 'positive',
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-2">{label}</p>
          <h3 className="text-2xl font-light tracking-tight text-gray-900">
            {value}
          </h3>
          {change && (
            <p
              className={`text-xs mt-2 ${
                changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
}
