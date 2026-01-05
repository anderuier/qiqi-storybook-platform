/**
 * Header 组件
 * 设计风格：梦幻童话风格
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navLinks = [
    { href: "#features", label: "功能特色" },
    { href: "#how-it-works", label: "创作流程" },
    { href: "#demo", label: "在线演示" },
    { href: "#tech", label: "技术架构" },
    { href: "#pricing", label: "成本估算" },
    { href: "#roadmap", label: "发展规划" },
  ];
  
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
              童话绘本工坊
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a 
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
              >
                {link.label}
              </a>
            ))}
          </nav>
          
          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="rounded-full">
              登录
            </Button>
            <Button className="bg-coral hover:bg-coral/90 text-white rounded-full shadow-md shadow-coral/20">
              开始创作
            </Button>
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
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                <Button variant="outline" className="flex-1 rounded-full">
                  登录
                </Button>
                <Button className="flex-1 bg-coral hover:bg-coral/90 text-white rounded-full">
                  开始创作
                </Button>
              </div>
            </nav>
          </div>
        </motion.div>
      )}
    </header>
  );
}
