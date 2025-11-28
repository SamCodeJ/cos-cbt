import React, { useState, useEffect } from "react";
import { examAPI, resultsAPI } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import StatCard from "@/components/StatCard";
import {
  FileText,
  Users,
  TrendingUp,
  PlusCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { calculatePassRate } from "@/lib/utils";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalExams: 0,
    totalCandidates: 0,
    activeTests: 0,
    passRate: 0,
  });
  const [recentExams, setRecentExams] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const exams = await examAPI.list();
      const allResults = await resultsAPI.list();

      const activeExams = exams.filter(e => e.status === 'active').length;
      const totalCandidates = exams.reduce((sum, e) => sum + (parseInt(e.candidate_count) || 0), 0);
      const passRate = calculatePassRate(allResults);

      setStats({
        totalExams: exams.length,
        totalCandidates,
        activeTests: activeExams,
        passRate,
      });

      // Recent exams data for chart
      const recent = exams.slice(0, 5).map(exam => {
        const examResults = allResults.filter(r => r.exam_id === exam.id);
        return {
          name: exam.title.substring(0, 15),
          candidates: examResults.length,
          passed: examResults.filter(r => r.passed).length,
        };
      });
      setChartData(recent);
      setRecentExams(exams.slice(0, 5));

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  const COLORS = ['#10b981', '#ef4444'];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Teacher Dashboard
            </h1>
            <p className="text-slate-600">
              Welcome back! Here's your exam overview.
            </p>
          </div>
          <Link to="/create-exam">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              <PlusCircle className="w-5 h-5 mr-2" />
              Create New Exam
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Exams" value={stats.totalExams} icon={FileText} color="blue" />
          <StatCard title="Total Candidates" value={stats.totalCandidates} icon={Users} color="green" />
          <StatCard title="Active Tests" value={stats.activeTests} icon={Clock} color="amber" />
          <StatCard title="Pass Rate" value={`${stats.passRate}%`} icon={TrendingUp} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Exams Performance */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-200 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">Recent Exam Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="candidates" fill="#3b82f6" name="Total" />
                    <Bar dataKey="passed" fill="#10b981" name="Passed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No exams yet</h3>
                  <p className="text-slate-500 mb-4">Create your first exam to see analytics.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Exams List */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-200 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-slate-900">Recent Exams</CardTitle>
                <Link to="/my-exams">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {recentExams.length > 0 ? (
                <div className="space-y-4">
                  {recentExams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{exam.title}</h4>
                        <p className="text-sm text-slate-600">{exam.subject}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {exam.status === 'active' ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            Active
                          </span>
                        ) : exam.status === 'scheduled' ? (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            Scheduled
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">No exams created yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

