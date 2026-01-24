/**
 * 绘本预览页面
 * 独立的绘本播放页面，用于查看已完成的绘本
 */

import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookStep } from "@/components/create";
import { worksApi, draftsApi } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface BookData {
  title: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    imagePrompt: string;
  }>;
  pageImages: Record<string, string>;
}

export default function BookPreview() {
  const [, params] = useRoute("/book/:workId");
  const [, setLocation] = useLocation();
  const workId = params?.workId;

  const [bookData, setBookData] = useState<BookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workId) {
      setError("作品ID不存在");
      setIsLoading(false);
      return;
    }

    loadBookData();
  }, [workId]);

  const loadBookData = async () => {
    if (!workId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 先尝试从草稿API获取
      const draft = await draftsApi.getDraft(workId);

      if (!draft.storyboard || draft.storyboard.pages.length === 0) {
        setError("该作品还没有生成分镜");
        setIsLoading(false);
        return;
      }

      // 检查是否有图片
      const hasImages = draft.storyboard.pages.some(page => page.imageUrl);
      if (!hasImages) {
        setError("该作品还没有生成图片，无法预览");
        setIsLoading(false);
        return;
      }

      // 构建页面数据
      const pageImages: Record<string, string> = {};
      draft.storyboard.pages.forEach(page => {
        if (page.imageUrl) {
          pageImages[String(page.pageNumber)] = page.imageUrl;
        }
      });

      setBookData({
        title: draft.work.title,
        pages: draft.storyboard.pages.map(page => ({
          pageNumber: page.pageNumber,
          text: page.text,
          imagePrompt: page.imagePrompt,
        })),
        pageImages,
      });
    } catch (err: any) {
      console.error("加载绘本失败:", err);
      setError(err.message || "加载绘本失败");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-coral mx-auto mb-4" />
            <p className="text-muted-foreground">加载绘本中...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">无法加载绘本</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button
              onClick={() => setLocation("/my-works")}
              className="bg-coral hover:bg-coral/90 text-white rounded-full px-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回我的作品
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!bookData) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setLocation("/my-works")}
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回我的作品
            </Button>
          </div>

          {/* 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{bookData.title}</h1>
            <p className="text-muted-foreground">共 {bookData.pages.length} 页</p>
          </div>

          {/* 绘本内容 */}
          <BookStep
            storyboardPages={bookData.pages}
            pageImages={bookData.pageImages}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
