/**
 * Header 组件
 * 设计风格：梦幻童话风格
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, Menu, X, LogOut, Settings, FolderOpen, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [location] = useLocation();

  // 使用真实的认证状态
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  // 处理退出登录
  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  const navLinks = [
    { href: "#features", label: "功能特色" },
    { href: "#how-it-works", label: "创作流程" },
    { href: "#demo", label: "在线演示" },
    { href: "#templates", label: "模板库" },
    { href: "#gallery", label: "作品广场" },
    { href: "#about", label: "关于我们" },
  ];

  // 平滑滚动到锚点
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    // 如果不在首页，先跳转到首页
    if (location !== "/") {
      window.location.href = "/" + href;
      return;
    }
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const headerHeight = 80; // Header 高度
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - headerHeight,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral to-coral/80 flex items-center justify-center shadow-lg shadow-coral/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-coral to-mint bg-clip-text text-transparent">
              柒柒の魔法绘本屋
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
              >
                {link.label}
              </a>
            ))}
          </nav>
          
          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              /* 已登录状态 - 用户菜单 */
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-mint overflow-hidden">
                    <img src={user.avatar || "/images/avatar-default.png"} alt={user.nickname} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-medium">{user.nickname}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* 用户下拉菜单 */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-border/50 py-2 min-w-[180px] z-20">
                      <Link href="/my-works" onClick={() => setIsUserMenuOpen(false)}>
                        <div className="px-4 py-2 text-sm hover:bg-muted flex items-center gap-3 cursor-pointer">
                          <FolderOpen className="w-4 h-4 text-coral" />
                          我的作品
                        </div>
                      </Link>
                      <Link href="/create" onClick={() => setIsUserMenuOpen(false)}>
                        <div className="px-4 py-2 text-sm hover:bg-muted flex items-center gap-3 cursor-pointer">
                          <BookOpen className="w-4 h-4 text-mint" />
                          创作新绘本
                        </div>
                      </Link>
                      <Link href="/settings" onClick={() => setIsUserMenuOpen(false)}>
                        <div className="px-4 py-2 text-sm hover:bg-muted flex items-center gap-3 cursor-pointer">
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          账户设置
                        </div>
                      </Link>
                      <div className="border-t border-border my-1" />
                      <div
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm hover:bg-muted flex items-center gap-3 cursor-pointer text-red-500"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* 未登录状态 */
              <>
                <Link href="/login">
                  <Button variant="ghost" className="rounded-full">
                    登录
                  </Button>
                </Link>
                <Link href="/create">
                  <Button className="bg-coral hover:bg-coral/90 text-white rounded-full shadow-md shadow-coral/20">
                    开始创作
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          className="lg:hidden bg-background border-b border-border"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="container py-4">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={(e) => handleNavClick(e, link.href)}
                >
                  {link.label}
                </a>
              ))}
              {isAuthenticated && user ? (
                /* 已登录状态 - 移动端 */
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-mint overflow-hidden">
                      <img src={user.avatar || "/images/avatar-default.png"} alt={user.nickname} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-medium">{user.nickname}</div>
                      <div className="text-xs text-muted-foreground">已登录</div>
                    </div>
                  </div>
                  <Link href="/my-works" onClick={() => setIsMenuOpen(false)}>
                    <div className="px-4 py-3 text-sm hover:bg-muted rounded-lg flex items-center gap-3">
                      <FolderOpen className="w-4 h-4 text-coral" />
                      我的作品
                    </div>
                  </Link>
                  <Link href="/create" onClick={() => setIsMenuOpen(false)}>
                    <div className="px-4 py-3 text-sm hover:bg-muted rounded-lg flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-mint" />
                      创作新绘本
                    </div>
                  </Link>
                  <Link href="/settings" onClick={() => setIsMenuOpen(false)}>
                    <div className="px-4 py-3 text-sm hover:bg-muted rounded-lg flex items-center gap-3 cursor-pointer">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      账户设置
                    </div>
                  </Link>
                  <div
                    onClick={handleLogout}
                    className="px-4 py-3 text-sm hover:bg-muted rounded-lg flex items-center gap-3 cursor-pointer text-red-500"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </div>
                </div>
              ) : (
                /* 未登录状态 - 移动端 */
                <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full rounded-full">
                      登录
                    </Button>
                  </Link>
                  <Link href="/create" className="flex-1">
                    <Button className="w-full bg-coral hover:bg-coral/90 text-white rounded-full">
                      开始创作
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </motion.div>
      )}
    </header>
  );
}
