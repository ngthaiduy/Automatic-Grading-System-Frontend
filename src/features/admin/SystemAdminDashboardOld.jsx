import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../app/context/authContext";

// ─── Mock data ─────────────────────────────────────────────────────────────────
const adminUser = {
  name: "System Admin",
  role: "Root Access",
  avatar: "SA",
  email: "admin@fpt.edu.vn",
};

const auditLogs = [
  {
    id: 1,
    initials: "NV",
    initialsColor: "bg-blue-100 text-blue-600",
    name: "Nguyen Van A",
    event: "Updated AI Prompt",
    eventIcon: "edit",
    eventCls: "bg-slate-100 text-slate-700 border-slate-200",
    time: "2 mins ago",
    ip: "192.168.1.1",
  },
  {
    id: 2,
    initials: "LT",
    initialsColor: "bg-purple-100 text-purple-600",
    name: "Le Thi B",
    event: "Created New Exam",
    eventIcon: "add_circle",
    eventCls: "bg-green-50 text-green-700 border-green-200",
    time: "15 mins ago",
    ip: "172.16.254.1",
  },
  {
    id: 3,
    initials: "SA",
    initialsColor: "bg-slate-800 text-white",
    name: "System Admin",
    event: "Modified Permissions",
    eventIcon: "admin_panel_settings",
    eventCls: "bg-orange-50 text-orange-700 border-orange-200",
    time: "1 hour ago",
    ip: "10.0.0.42",
  },
  {
    id: 4,
    initials: "TV",
    initialsColor: "bg-blue-100 text-blue-600",
    name: "Tran Van C",
    event: "Approved Appeal #104",
    eventIcon: "done_all",
    eventCls: "bg-blue-50 text-blue-700 border-blue-200",
    time: "3 hours ago",
    ip: "192.168.1.15",
  },
  {
    id: 5,
    initials: "NT",
    initialsColor: "bg-blue-100 text-blue-600",
    name: "Nguyen Thi D",
    event: "Updated PayOS Config",
    eventIcon: "settings",
    eventCls: "bg-slate-100 text-slate-700 border-slate-200",
    time: "5 hours ago",
    ip: "127.0.0.1",
  },
];

// ─── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Monitoring",
    items: [
      { icon: "dashboard",   label: "Dashboard",      to: "/admin",                active: true  },
      { icon: "monitoring",  label: "System Metrics", to: "/admin/metrics",        active: false },
    ],
  },
  {
    label: "Management",
    items: [
      { icon: "group",       label: "Users & Roles",  to: "/admin/users",          active: false },
      { icon: "rule",        label: "Grading Rules",  to: "/admin/grading-rules",  active: false },
    ],
  },
  {
    label: "Configuration",
    items: [
      { icon: "memory",      label: "AI Models",      to: "/admin/ai-models",      active: false },
      { icon: "settings",    label: "Settings",       to: "/admin/settings",       active: false },
    ],
  },
];

// ─── Main component ────────────────────────────────────────────────────────────
export default function SystemAdminDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const [notifCount] = useState(3);
  const [activeChart, setActiveChart] = useState("24H");

  const headerDropdownRef = useRef(null);
  const sidebarDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(e.target))
        setHeaderDropdownOpen(false);
      if (sidebarDropdownRef.current && !sidebarDropdownRef.current.contains(e.target))
        setSidebarDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    // Cookie HttpOnly sẽ bị backend tự động xóa khi gọi API logout
    navigate("/login");
  };

  // Use real user data from context if available, fallback to mock
  const displayName = user?.fullName || adminUser.name;
  const displayEmail = user?.email || adminUser.email;
  const displayInitials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen bg-slate-100 font-[Inter,sans-serif] text-slate-900">

      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      <aside
        className={`${
          sidebarOpen ? "w-[240px]" : "w-[72px]"
        } transition-[width] duration-300 ease-in-out flex-shrink-0 flex flex-col bg-[#0F172A] shadow-xl z-20 h-screen sticky top-0`}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
          <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">terminal</span>
          </div>
          {sidebarOpen && (
            <h1 className="text-white text-sm font-bold uppercase tracking-wider whitespace-nowrap">
              SysAdmin<span className="text-blue-500">Pro</span>
            </h1>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {sidebarOpen && (
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    title={!sidebarOpen ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group
                      ${
                        item.active
                          ? "bg-blue-600/20 text-blue-400 border-l-[3px] border-blue-500 shadow-[inset_4px_0_8px_-4px_rgba(59,130,246,0.5)]"
                          : "text-slate-400 hover:bg-slate-800 hover:text-blue-400 border-l-[3px] border-transparent"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[20px] flex-shrink-0">{item.icon}</span>
                    {sidebarOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: User dropdown */}
        <div className="p-3 bg-slate-900 border-t border-slate-800" ref={sidebarDropdownRef}>
          {/* Popup above */}
          {sidebarDropdownOpen && sidebarOpen && (
            <div className="mb-2 bg-[#1e293b] rounded-xl border border-slate-700 shadow-xl py-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-sm font-bold text-white truncate">{displayName}</p>
                <p className="text-xs text-blue-400 truncate">{displayEmail}</p>
              </div>
              <Link
                to="/admin/profile"
                onClick={() => setSidebarDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                Hồ sơ cá nhân
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Đăng xuất
              </button>
            </div>
          )}

          {/* Trigger */}
          <button
            onClick={() => setSidebarDropdownOpen(!sidebarDropdownOpen)}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800 transition-colors ${
              !sidebarOpen ? "justify-center" : ""
            }`}
          >
            <div className="relative flex-shrink-0">
              <div
                className={`size-9 rounded-full bg-blue-900 border flex items-center justify-center text-blue-300 font-bold text-sm transition-all
                  ${sidebarDropdownOpen ? "border-blue-500" : "border-blue-700"}`}
              >
                <span className="material-symbols-outlined text-[20px]">shield_person</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 bg-green-500 border-2 border-slate-900 rounded-full" />
            </div>
            {sidebarOpen && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-blue-400 truncate">Root Access</p>
                </div>
                <span
                  className={`material-symbols-outlined text-slate-400 text-[18px] transition-transform duration-200 ${
                    sidebarDropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  expand_less
                </span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          {/* Left: menu toggle + breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight tracking-tight">
                System Overview
              </h2>
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <span className="material-symbols-outlined text-[13px]">home</span>
                <span className="text-slate-400">/</span>
                <span className="text-blue-600 font-semibold">Dashboard</span>
              </div>
            </div>
          </div>

          {/* Right: status + notif + avatar */}
          <div className="flex items-center gap-5">
            {/* System status chip */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
              <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
              <span className="text-xs font-medium text-slate-600">System Status: Optimal</span>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button className="relative p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-600">
                <span className="material-symbols-outlined">notifications</span>
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 size-2 bg-blue-600 rounded-full ring-2 ring-white" />
                )}
              </button>
            </div>

            {/* Avatar dropdown */}
            <div
              className="pl-5 border-l border-slate-200 flex items-center gap-2 relative"
              ref={headerDropdownRef}
            >
              <button
                onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div
                  className={`size-8 rounded-full bg-blue-900 border ring-2 transition-all flex items-center justify-center text-blue-300 overflow-hidden
                    ${headerDropdownOpen ? "ring-blue-400" : "ring-transparent group-hover:ring-blue-200"}`}
                >
                  <span className="material-symbols-outlined text-[20px]">shield_person</span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-slate-600 transition-colors">
                  expand_more
                </span>
              </button>

              {/* Dropdown */}
              {headerDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">{displayName}</p>
                    <p className="text-xs text-blue-500 font-medium">Root Access</p>
                    <p className="text-xs text-slate-400 mt-0.5">{displayEmail}</p>
                  </div>
                  <Link
                    to="/admin/profile"
                    onClick={() => setHeaderDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    to="/admin/settings"
                    onClick={() => setHeaderDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-400">settings</span>
                    Cài đặt hệ thống
                  </Link>
                  <div className="border-t border-slate-100 mt-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page body ─────────────────────────────────────────────────────────── */}
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">

          {/* ── Metric cards ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* Total Users — blue gradient */}
            <div className="relative overflow-hidden rounded-3xl p-6 flex flex-col gap-4
              bg-gradient-to-br from-blue-600 to-blue-800
              shadow-lg shadow-blue-500/20 group hover:-translate-y-1 transition-all duration-300">
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[110px] text-white/10 group-hover:scale-110 transition-transform duration-500 pointer-events-none select-none">
                group
              </span>
              <div className="flex items-center justify-between">
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.15em]">Total Users</p>
                <div className="size-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                  <span className="material-symbols-outlined text-white text-[18px]">group</span>
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-black text-white tracking-tight">1,240</h3>
                <div className="mt-2 inline-flex items-center gap-1 bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[13px]">trending_up</span>5.2% this month
                </div>
              </div>
            </div>

            {/* Active Exams — indigo gradient */}
            <div className="relative overflow-hidden rounded-3xl p-6 flex flex-col gap-4
              bg-gradient-to-br from-indigo-500 to-indigo-700
              shadow-lg shadow-indigo-500/20 group hover:-translate-y-1 transition-all duration-300">
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[110px] text-white/10 group-hover:scale-110 transition-transform duration-500 pointer-events-none select-none">
                assignment
              </span>
              <div className="flex items-center justify-between">
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.15em]">Active Exams</p>
                <div className="size-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                  <span className="material-symbols-outlined text-white text-[18px]">assignment</span>
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-black text-white tracking-tight">12</h3>
                <div className="mt-2 inline-flex items-center gap-1 bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[13px]">trending_flat</span>Stable
                </div>
              </div>
            </div>

            {/* Submissions — sky gradient */}
            <div className="relative overflow-hidden rounded-3xl p-6 flex flex-col gap-4
              bg-gradient-to-br from-sky-500 to-cyan-600
              shadow-lg shadow-sky-500/20 group hover:-translate-y-1 transition-all duration-300">
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[110px] text-white/10 group-hover:scale-110 transition-transform duration-500 pointer-events-none select-none">
                task
              </span>
              <div className="flex items-center justify-between">
                <p className="text-sky-100 text-[10px] font-black uppercase tracking-[0.15em]">Submissions</p>
                <div className="size-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                  <span className="material-symbols-outlined text-white text-[18px]">task</span>
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-black text-white tracking-tight">45.2k</h3>
                <div className="mt-2 inline-flex items-center gap-1 bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[13px]">trending_up</span>12.1% this month
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl p-6 flex flex-col gap-4
              bg-gradient-to-br from-rose-500 to-red-700
              shadow-lg shadow-rose-500/20 group hover:-translate-y-1 transition-all duration-300">
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[110px] text-white/10 group-hover:scale-110 transition-transform duration-500 pointer-events-none select-none">
                warning
              </span>
              <div className="flex items-center justify-between">
                <p className="text-rose-100 text-[10px] font-black uppercase tracking-[0.15em]">Pending Appeals</p>
                <div className="size-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                  <span className="material-symbols-outlined text-white text-[18px]">priority_high</span>
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-black text-white tracking-tight">18</h3>
                <div className="mt-2 inline-flex items-center gap-1 bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[13px]">priority_high</span>Action required
                </div>
              </div>
            </div>
          </div>

          {/* ── Middle row: Activity chart + User distribution ─────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* System Activity line chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">System Activity</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Submission volume — last 24 hours</p>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {["24H", "7D", "30D"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveChart(tab)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        activeChart === tab
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Y-axis labels + chart */}
              <div className="flex gap-3 flex-1 min-h-[260px]">
                <div className="flex flex-col justify-between text-[10px] font-bold text-slate-300 text-right pb-6 pt-1 w-8 flex-shrink-0">
                  {["500","400","300","200","100","0"].map((v) => <span key={v}>{v}</span>)}
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="relative flex-1">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[0,1,2,3,4].map((i) => (
                        <div key={i} className="w-full border-t border-dashed border-slate-100" />
                      ))}
                    </div>
                    {/* SVG line chart */}
                    <svg className="w-full h-full relative z-10" viewBox="0 0 500 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="blueGradientAdmin" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                        <filter id="glowAdmin" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      {/* Area fill */}
                      <path
                        d="M0,160 C30,155 60,140 80,110 C100,80 130,140 160,130 C190,120 220,75 240,70 C260,65 295,95 320,90 C345,85 375,35 400,30 C420,25 465,55 500,60 V200 H0 Z"
                        fill="url(#blueGradientAdmin)"
                      />
                      {/* Line with glow */}
                      <path
                        d="M0,160 C30,155 60,140 80,110 C100,80 130,140 160,130 C190,120 220,75 240,70 C260,65 295,95 320,90 C345,85 375,35 400,30 C420,25 465,55 500,60"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        filter="url(#glowAdmin)"
                      />
                      {/* Data points */}
                      {[[80,110],[160,130],[240,70],[320,90],[400,30]].map(([cx,cy],i) => (
                        <g key={i}>
                          <circle cx={cx} cy={cy} r="6" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2.5" />
                          <circle cx={cx} cy={cy} r="2.5" fill="#2563EB" />
                        </g>
                      ))}
                    </svg>
                  </div>
                  {/* X-axis labels */}
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-300 tracking-wider">
                    {["00:00","04:00","08:00","12:00","16:00","20:00","24:00"].map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* User Distribution donut */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">User Distribution</h4>
                  <p className="text-xs text-slate-400 mt-0.5">By account role</p>
                </div>
                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">more_vert</span>
                </button>
              </div>

              {/* Donut */}
              <div className="flex-1 flex items-center justify-center relative py-2">
                {/* Glow */}
                <div className="absolute size-36 bg-blue-500/15 rounded-full blur-2xl" />
                <div className="size-48 flex items-center justify-center relative">
                  <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
                    {/* Students 90% */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#E2E8F0" strokeWidth="14" />
                    <circle
                      cx="50" cy="50" r="38"
                      fill="none" stroke="#1E40AF" strokeWidth="14"
                      strokeDasharray="215 24" strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    {/* Lecturers 7% */}
                    <circle
                      cx="50" cy="50" r="38"
                      fill="none" stroke="#60A5FA" strokeWidth="14"
                      strokeDasharray="17 222" strokeDashoffset="-215"
                      strokeLinecap="round"
                    />
                    {/* Staff/Admin 3% */}
                    <circle
                      cx="50" cy="50" r="38"
                      fill="none" stroke="#CBD5E1" strokeWidth="14"
                      strokeDasharray="8 231" strokeDashoffset="-232"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center z-10 bg-white rounded-full size-28 flex flex-col items-center justify-center shadow-md ring-1 ring-slate-100">
                    <p className="text-3xl font-black text-slate-800 leading-none">1.2k</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1">Total</p>
                  </div>
                </div>
              </div>

              {/* Legend — 2-col grid */}
              <div className="mt-4 space-y-2.5">
                {[
                  { color: "bg-blue-800",  pill: "bg-blue-50 text-blue-800",   label: "Students",    value: "90%", count: "1,116" },
                  { color: "bg-blue-400",  pill: "bg-blue-50 text-blue-500",   label: "Lecturers",   value: "7%",  count: "87"   },
                  { color: "bg-slate-300", pill: "bg-slate-100 text-slate-500", label: "Staff/Admin", value: "3%",  count: "37"   },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`size-2.5 rounded-full ${item.color}`} />
                      <span className="text-sm font-medium text-slate-600">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">{item.count}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.pill}`}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bottom row: Audit log + Resource monitors ──────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Audit Log */}
            <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 text-[20px]">history</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base leading-tight">Audit Log</h4>
                    <p className="text-xs text-slate-400">Recent system activity</p>
                  </div>
                </div>
                <button className="text-xs text-blue-600 font-bold hover:text-blue-800 uppercase tracking-wider bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors">
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">User</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Event</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Time</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Source IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`size-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${log.initialsColor}`}>
                              {log.initials}
                            </div>
                            <span className="font-semibold text-slate-800 text-sm">{log.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${log.eventCls}`}>
                            <span className="material-symbols-outlined text-[13px]">{log.eventIcon}</span>
                            {log.event}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs font-medium whitespace-nowrap">{log.time}</td>
                        <td className="px-6 py-4">
                          <code className="text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">
                            {log.ip}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resource Monitors */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-[20px]">dns</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base leading-tight">Resource monitoring</h4>
                  <p className="text-xs text-slate-400">Use the live dashboard for real-time metrics</p>
                </div>
              </div>

              <div className="flex-1 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 flex items-center justify-center text-center">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Live CPU, memory, and disk metrics are shown in the current admin dashboard.</p>
                  <p className="text-xs text-slate-500 mt-1">This legacy template no longer contains hard-coded monitor values.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="p-6 mt-auto text-center text-slate-300 text-xs font-medium border-t border-slate-100">
          © 2024 FPT University • System Administration Interface • Version 2.4.1
        </footer>
      </main>
    </div>
  );
}
