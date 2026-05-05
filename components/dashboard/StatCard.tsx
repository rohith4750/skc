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
  return (
    <Link
      href={href}
      className="card-premium glass group p-5 rounded-2xl animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="relative z-10">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-black text-gray-900 drop-shadow-sm">
            {value}
          </p>
          {subValue && (
            <p className="text-[10px] font-bold text-gray-400 mt-1.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              {subValue}
            </p>
          )}
        </div>
        <div
          className={`${bgColor} p-3.5 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm relative z-10`}
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 ${bgColor} opacity-[0.03] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
    </Link>
  );
}
