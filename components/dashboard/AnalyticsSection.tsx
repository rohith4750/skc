"use client";

import { IconType } from "react-icons";

interface AnalyticsItem {
  label: string;
  value: string | number;
  color: string;
  icon?: IconType;
}

interface AnalyticsSectionProps {
  title: string;
  icon: IconType;
  items: AnalyticsItem[];
  index?: number;
}

export function AnalyticsSection({
  title,
  icon: Icon,
  items,
  index = 0,
}: AnalyticsSectionProps) {
  return (
    <div
      className="glass rounded-3xl p-6 animate-fade-in relative overflow-hidden"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="bg-primary-50 p-2.5 rounded-xl shadow-sm">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <h2 className="text-lg font-black text-gray-800 tracking-tight">
          {title}
        </h2>
      </div>
      
      <div className="space-y-4 relative z-10">
        {items.map((item, idx) => {
          const ItemIcon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 transition-colors group"
            >
              <span className="text-sm font-bold text-gray-500 group-hover:text-gray-700 transition-colors">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                {ItemIcon && (
                  <ItemIcon className={`w-3.5 h-3.5 ${item.color} animate-float`} />
                )}
                <span className={`text-sm font-black ${item.color}`}>
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-[60px] rounded-full"></div>
    </div>
  );
}
