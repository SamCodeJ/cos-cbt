import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { authAPI } from "@/api/client";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  BookOpen,
  BarChart3,
  Users,
  Settings,
  Crown,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

function LayoutContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { open } = useSidebar();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await authAPI.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to load user:", error);
      // Don't navigate here - let the response interceptor handle it
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    setCurrentUser(null);
    navigate('/login');
  };

  const teacherNavigationItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "My Exams",
      url: "/my-exams",
      icon: FileText,
    },
    {
      title: "Create Exam",
      url: "/create-exam",
      icon: PlusCircle,
    },
    {
      title: "Question Bank",
      url: "/question-bank",
      icon: BookOpen,
    },
    {
      title: "Candidates",
      url: "/candidates",
      icon: Users,
    },
    {
      title: "Results",
      url: "/results",
      icon: BarChart3,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  const adminMenuItems = [
    {
      title: "Admin Dashboard",
      url: "/admin",
      icon: Crown,
    },
    {
      title: "Manage Teachers",
      url: "/admin/teachers",
      icon: Users,
    },
    {
      title: "Audit Logs",
      url: "/admin/audit-logs",
      icon: ClipboardList,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <Sidebar className="border-r border-slate-200 bg-white" collapsible="icon">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <img 
                src="/images/logo.svg" 
                alt="UI-GES Logo" 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  // Try PNG fallback, then gradient box
                  if (!e.target.dataset.fallback) {
                    e.target.dataset.fallback = 'true';
                    e.target.src = '/images/logo.png';
                  } else {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }
                }}
              />
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg items-center justify-center hidden">
                <span className="text-white font-bold text-xl">UI</span>
              </div>
              <div>
                <h2 className="font-bold text-xl text-slate-900">UI-GES</h2>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Testing System</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {teacherNavigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-amber-50 hover:text-amber-900 transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url ? 'bg-amber-50 text-amber-900 border-l-2 border-amber-600' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {currentUser?.role === 'admin' && (
              <SidebarGroup className="mt-8">
                <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-2">
                  Admin Panel
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`hover:bg-purple-50 hover:text-purple-900 transition-all duration-200 rounded-lg mb-1 ${
                            location.pathname === item.url ? 'bg-purple-50 text-purple-900 border-l-2 border-purple-600' : ''
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            <SidebarGroup className="mt-8">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-2">
                Account
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">
                        {currentUser?.name || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {currentUser?.role === 'admin' ? 'Administrator' : 'Teacher'}
                      </p>
                    </div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

      <div className={`ml-0 transition-[margin] duration-300 ease-in-out ${open ? 'md:ml-64' : 'md:ml-12'}`}>
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 md:hidden">
          <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
          <img 
            src="/images/logo-sm.png" 
            alt="UI-GES Logo" 
            className="w-8 h-8 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg items-center justify-center hidden">
            <span className="text-white font-bold text-sm">UI</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">UI-GES</h1>
        </header>

        <div className="hidden md:flex items-center gap-4 bg-white border-b border-slate-200 px-6 py-3">
          <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
        </div>

        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <LayoutContent />
    </SidebarProvider>
  );
}

