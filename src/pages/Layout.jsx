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
  const { open, isMobile, openMobile } = useSidebar();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use the correct open state based on device
  const isOpen = isMobile ? openMobile : open;

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
          {/* Sidebar Header - Only show on desktop or when mobile sidebar is open */}
          <SidebarHeader className={`border-b border-slate-200 transition-all duration-300 ${isOpen ? 'p-6' : 'p-3'}`}>
            <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
              <img 
                src="/images/logo.svg" 
                alt="C-COS Logo" 
                className="w-10 h-10 object-contain drop-shadow-md flex-shrink-0"
                onError={(e) => {
                  if (!e.target.dataset.fallback) {
                    e.target.dataset.fallback = 'true';
                    e.target.src = '/images/logo.png';
                  } else {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }
                }}
              />
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg items-center justify-center flex-shrink-0 hidden">
                <span className="text-white font-bold text-xl">UI</span>
              </div>
              {isOpen && (
                <div>
                  <h2 className="font-bold text-xl text-slate-900 whitespace-nowrap">C-COS</h2>
                  <p className="text-xs text-slate-500 uppercase tracking-wider whitespace-nowrap">Testing System</p>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className={`transition-all duration-300 ${isOpen ? 'p-4' : 'p-2'}`}>
            <SidebarGroup>
              {isOpen && (
                <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-2">
                  Navigation
                </SidebarGroupLabel>
              )}
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
                        <Link to={item.url} className={`flex items-center py-3 ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'}`}>
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {isOpen && (
                            <span className="font-medium whitespace-nowrap">
                              {item.title}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {currentUser?.role === 'admin' && (
              <SidebarGroup className="mt-8">
                {isOpen && (
                  <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-2">
                    Admin Panel
                  </SidebarGroupLabel>
                )}
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
                          <Link to={item.url} className={`flex items-center py-3 ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'}`}>
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {isOpen && (
                              <span className="font-medium whitespace-nowrap">
                                {item.title}
                              </span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            <SidebarGroup className="mt-8">
              {isOpen && (
                <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-2">
                  Account
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <div className={`py-2 space-y-3 ${isOpen ? 'px-3' : 'flex justify-center'}`}>
                  <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    {isOpen && (
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">
                          {currentUser?.name || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {currentUser?.role === 'admin' ? 'Administrator' : 'Teacher'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className={`border-t border-slate-200 transition-all duration-300 ${isOpen ? 'p-4' : 'p-2'}`}>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={`w-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 ${isOpen ? 'justify-start' : 'justify-center px-0'}`}
            >
              <LogOut className={`w-4 h-4 flex-shrink-0 ${isOpen ? 'mr-2' : ''}`} />
              {isOpen && <span>Sign Out</span>}
            </Button>
          </SidebarFooter>
        </Sidebar>

      <div className={`ml-0 transition-[margin] duration-300 ease-in-out ${open ? 'md:ml-64' : 'md:ml-12'}`}>
        {/* Mobile Header - Higher z-index than sidebar */}
        <header className="sticky top-0 z-[60] bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 md:hidden shadow-sm">
          <SidebarTrigger className="flex-shrink-0 hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200 -ml-2" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img 
              src="/images/logo.svg" 
              alt="C-COS Logo" 
              className="w-8 h-8 object-contain drop-shadow-sm flex-shrink-0"
              onError={(e) => {
                if (!e.target.dataset.fallback) {
                  e.target.dataset.fallback = 'true';
                  e.target.src = '/images/logo.png';
                } else {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }
              }}
            />
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg items-center justify-center flex-shrink-0 hidden">
              <span className="text-white font-bold text-sm">UI</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-slate-900 leading-tight">C-COS</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider leading-tight">Testing System</p>
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-4 bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-40 shadow-sm">
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

