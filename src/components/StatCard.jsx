import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const colorMap = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

export default function StatCard({ title, value, icon: Icon, color = 'blue', trend }) {
  const bgColor = colorMap[color] || colorMap.blue;

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${bgColor} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${bgColor.replace('bg-', 'text-')}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {trend && (
          <p className="text-xs text-slate-600 mt-1">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

