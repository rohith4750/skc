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
      className="bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 rounded-[4px] p-6 animate-fade-in relative overflow-hidden"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="bg-indigo-50 p-2.5 rounded-[4px] border border-indigo-100 shadow-xs">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-black text-slate-800 tracking-tight">
          {title}
        </h2>
      </div>
      
      <div className="space-y-3 relative z-10">
        {items.map((item, idx) => {
          const ItemIcon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-[4px] bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 transition-colors group"
            >
              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                {ItemIcon && (
                  <ItemIcon className={`w-3.5 h-3.5 ${item.color}`} />
                )}
                <span className={`text-sm font-black ${item.color}`}>
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
