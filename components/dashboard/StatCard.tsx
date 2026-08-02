"use client";

import Link from "next/link";
import { IconType } from "react-icons";

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: IconType;
  color: string;
  bgColor: string;
  href: string;
  index?: number;
}

function getCardBorderColor(color: string, title: string): string {
  const t = title.toLowerCase();
  if (t.includes('customer')) return 'border-amber-300/80 hover:border-amber-500 bg-gradient-to-br from-white to-amber-50/20';
  if (t.includes('billed')) return 'border-orange-300/80 hover:border-orange-500 bg-gradient-to-br from-white to-orange-50/20';
  if (t.includes('collected')) return 'border-emerald-300/80 hover:border-emerald-500 bg-gradient-to-br from-white to-emerald-50/20';
  if (t.includes('profit')) return 'border-emerald-300/80 hover:border-emerald-500 bg-gradient-to-br from-white to-emerald-50/20';
  if (t.includes('expense')) return 'border-rose-300/80 hover:border-rose-500 bg-gradient-to-br from-white to-rose-50/20';
  if (t.includes('menu')) return 'border-amber-300/80 hover:border-amber-500 bg-gradient-to-br from-white to-amber-50/20';
  if (t.includes('user')) return 'border-purple-300/80 hover:border-purple-500 bg-gradient-to-br from-white to-purple-50/20';
  if (t.includes('workforce')) return 'border-blue-300/80 hover:border-blue-500 bg-gradient-to-br from-white to-blue-50/20';
  if (t.includes('stock')) return 'border-yellow-300/80 hover:border-yellow-500 bg-gradient-to-br from-white to-yellow-50/20';
  if (t.includes('inventory')) return 'border-slate-300/80 hover:border-slate-500 bg-gradient-to-br from-white to-slate-50/20';

  if (color.includes('green') || color.includes('emerald')) return 'border-emerald-300/80 hover:border-emerald-500 bg-gradient-to-br from-white to-emerald-50/20';
  if (color.includes('red') || color.includes('rose')) return 'border-rose-300/80 hover:border-rose-500 bg-gradient-to-br from-white to-rose-50/20';
  if (color.includes('purple')) return 'border-purple-300/80 hover:border-purple-500 bg-gradient-to-br from-white to-purple-50/20';
  if (color.includes('blue')) return 'border-blue-300/80 hover:border-blue-500 bg-gradient-to-br from-white to-blue-50/20';
  if (color.includes('yellow')) return 'border-yellow-300/80 hover:border-yellow-500 bg-gradient-to-br from-white to-yellow-50/20';

  return 'border-slate-200/90 hover:border-slate-400 bg-white';
}

export function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  color,
  bgColor,
  href,
  index = 0,
}: StatCardProps) {
  const cardBorderClass = getCardBorderColor(color, title);

  return (
    <Link
      href={href}
      className={`border ${cardBorderClass} shadow-xs hover:shadow-md transition-all duration-200 p-5 rounded-[4px] relative overflow-hidden group animate-fade-in`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="relative z-10">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-black text-slate-900 drop-shadow-sm">
            {value}
          </p>
          {subValue && (
            <p className="text-[10px] font-bold text-slate-400 mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-[2px] bg-slate-400"></span>
              {subValue}
            </p>
          )}
        </div>
        <div
          className={`${bgColor} p-3 rounded-[4px] group-hover:scale-105 transition-all duration-300 shadow-xs relative z-10 border border-slate-100/80`}
        >
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </Link>
  );
}
