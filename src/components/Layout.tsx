import { Outlet, Link, useLocation } from "react-router-dom"
import { LayoutDashboard, Users, Calendar, Clock, DollarSign, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { path: "/", label: "仪表盘", icon: LayoutDashboard },
  { path: "/students", label: "学员管理", icon: Users },
  { path: "/scheduling", label: "教练车排班", icon: Calendar },
  { path: "/checkin", label: "学时打卡", icon: Clock },
  { path: "/commission", label: "提成核算", icon: DollarSign },
]

const pageTitles: Record<string, string> = {
  "/": "仪表盘",
  "/students": "学员管理",
  "/scheduling": "教练车排班",
  "/checkin": "学时打卡",
  "/commission": "提成核算",
}

export default function Layout() {
  const location = useLocation()
  const basePath = "/" + location.pathname.split("/")[1]
  const title = location.pathname.startsWith("/students/") ? "学员详情" : (pageTitles[basePath] || "驾校管理系统")

  return (
    <div className="flex h-screen bg-zinc-50">
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200">
          <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">驾</span>
          </div>
          <span className="ml-3 font-semibold text-zinc-900 text-base">驾校管理系统</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-700 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-200 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">管理员</p>
              <p className="text-xs text-zinc-500 truncate">admin@school.com</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">管理员</span>
            <div className="w-8 h-8 bg-teal-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">管</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
