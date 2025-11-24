import React, { useState, useEffect } from 'react';
import { examAPI, resultsAPI, teacherAPI } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/StatCard';
import { Users, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalExams: 0,
    totalResults: 0,
    systemPassRate: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [teachers, exams, results] = await Promise.all([
        teacherAPI.list(),
        examAPI.list(),
        resultsAPI.list(),
      ]);

      const passed = results.filter(r => r.passed).length;
      const passRate = results.length > 0 ? Math.round((passed / results.length) * 100) : 0;

      setStats({
        totalTeachers: teachers.length,
        totalExams: exams.length,
        totalResults: results.length,
        systemPassRate: passRate,
      });

      // Teacher activity chart
      const teacherActivity = teachers.slice(0, 5).map(teacher => {
        const teacherExams = exams.filter(e => e.teacher_id === teacher.id);
        return {
          name: teacher.name.split(' ')[0],
          exams: teacherExams.length,
        };
      });
      setChartData(teacherActivity);

    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="grid grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">System-wide overview and analytics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Teachers" value={stats.totalTeachers} icon={Users} color="blue" />
          <StatCard title="Total Exams" value={stats.totalExams} icon={FileText} color="green" />
          <StatCard title="Total Results" value={stats.totalResults} icon={BarChart3} color="purple" />
          <StatCard title="System Pass Rate" value={`${stats.systemPassRate}%`} icon={TrendingUp} color="amber" />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Teacher Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="exams" fill="#d97706" name="Exams Created" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No teacher activity data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

