/**
 * Footer 组件
 * 设计风格：梦幻童话风格
 */

import { BookOpen, Heart, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-foreground/5 border-t border-border">
      <div className="container py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral to-coral/80 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">童话绘本工坊</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              用AI和爱为3-6岁学龄前儿童创作独一无二的个性化绘本，让每个孩子都有属于自己的童话故事。
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="w-4 h-4 text-coral" />
              <span>用心为每个家庭服务</span>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">快速链接</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  功能特色
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  创作流程
                </a>
              </li>
              <li>
                <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  在线演示
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  成本估算
                </a>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">资源中心</h4>
            <ul className="space-y-2">
              <li>
                <a href="#tech" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  技术架构
                </a>
              </li>
              <li>
                <a href="#roadmap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  发展规划
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  API文档
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  帮助中心
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">联系我们</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-coral" />
                <span>hello@storybook.ai</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-mint" />
                <span>400-888-8888</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-sunny mt-0.5" />
                <span>北京市海淀区中关村科技园</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 童话绘本工坊. 保留所有权利.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              隐私政策
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              服务条款
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cookie设置
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
