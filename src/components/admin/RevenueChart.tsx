'use client';

export default function RevenueChart() {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Revenue Trends</h3>
          <p className="text-xs text-gray-500 mt-1">
            Performance overview across the fiscal year
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
            QUARTERLY
          </button>
          <button className="px-3 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800">
            ANNUAL
          </button>
        </div>
      </div>

      {/* Simplified Chart */}
      <div className="flex items-end justify-between h-48 gap-1">
        {[35, 45, 55, 48, 62, 75, 58, 72, 85, 78, 88, 92].map((value, idx) => (
          <div
            key={idx}
            className="flex-1 bg-linear-to-t from-gray-900 to-gray-700 rounded-t opacity-80 hover:opacity-100 transition-opacity"
            style={{ height: `${(value / 100) * 100}%` }}
            title={`${value}%`}
          />
        ))}
      </div>

      <div className="flex justify-between mt-4 text-xs text-gray-500">
        <span>JAN</span>
        <span>MAR</span>
        <span>MAY</span>
        <span>JUL</span>
        <span>SEP</span>
        <span>NOV</span>
      </div>
    </div>
  );
}
