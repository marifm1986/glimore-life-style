'use client';

export default function SalesChart() {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-100">
      <h3 className="text-sm font-medium text-gray-900 mb-6">Sales by Category</h3>

      {/* Pie Chart - Simplified SVG */}
      <div className="flex justify-center mb-6">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Circle background */}
          <circle cx="100" cy="100" r="80" fill="none" stroke="#f3f4f6" strokeWidth="40" />
          
          {/* High Jewelry - 40% */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#000000"
            strokeWidth="40"
            strokeDasharray="201 502"
            strokeDashoffset="0"
            transform="rotate(-90 100 100)"
          />
          
          {/* Watches - 35% */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#666666"
            strokeWidth="40"
            strokeDasharray="176 502"
            strokeDashoffset="-201"
            transform="rotate(-90 100 100)"
          />
          
          {/* Bracelets - 25% */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#cccccc"
            strokeWidth="40"
            strokeDasharray="126 502"
            strokeDashoffset="-377"
            transform="rotate(-90 100 100)"
          />
          
          {/* Center text */}
          <text x="100" y="105" textAnchor="middle" className="text-lg font-bold" fill="#000">
            100%
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gray-900 rounded-full" />
            <span className="text-sm text-gray-700">High Jewelry</span>
          </div>
          <span className="text-sm font-medium text-gray-900">40%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gray-600 rounded-full" />
            <span className="text-sm text-gray-700">Watches</span>
          </div>
          <span className="text-sm font-medium text-gray-900">35%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gray-300 rounded-full" />
            <span className="text-sm text-gray-700">Bracelets</span>
          </div>
          <span className="text-sm font-medium text-gray-900">25%</span>
        </div>
      </div>
    </div>
  );
}
