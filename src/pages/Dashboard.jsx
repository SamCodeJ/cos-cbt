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
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Teacher Dashboard
            </h1>
            <p className="text-sm md:text-base text-slate-600">
              Welcome back! Here's your exam overview.
            </p>
          </div>
          <Link to="/create-exam" className="w-full md:w-auto">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white w-full md:w-auto">
              <PlusCircle className="w-5 h-5 mr-2" />
              Create New Exam
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <StatCard title="Total Exams" value={stats.totalExams} icon={FileText} color="blue" />
          <StatCard title="Total Candidates" value={stats.totalCandidates} icon={Users} color="green" />
          <StatCard title="Active Tests" value={stats.activeTests} icon={Clock} color="amber" />
          <StatCard title="Pass Rate" value={`${stats.passRate}%`} icon={TrendingUp} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Recent Exams Performance */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-200 pb-4">
              <CardTitle className="text-lg md:text-xl font-bold text-slate-900">Recent Exam Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="candidates" fill="#3b82f6" name="Total" />
                    <Bar dataKey="passed" fill="#10b981" name="Passed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-base md:text-lg font-semibold text-slate-600 mb-2">No exams yet</h3>
                  <p className="text-sm text-slate-500 mb-4">Create your first exam to see analytics.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Exams List */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-200 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg md:text-xl font-bold text-slate-900">Recent Exams</CardTitle>
                <Link to="/my-exams">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {recentExams.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {recentExams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex-1 min-w-0 pr-3">
                        <h4 className="font-semibold text-slate-900 text-sm md:text-base truncate">{exam.title}</h4>
                        <p className="text-xs md:text-sm text-slate-600 truncate">{exam.subject}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {exam.status === 'active' ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded whitespace-nowrap">
                            Active
                          </span>
                        ) : exam.status === 'scheduled' ? (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded whitespace-nowrap">
                            Scheduled
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded whitespace-nowrap">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-sm text-slate-500">No exams created yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

