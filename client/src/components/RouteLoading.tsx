import { Spinner } from "@/components/ui/spinner";

/**
 * 路由懒加载时的加载占位组件
 * 在页面组件动态导入期间显示
 */
export function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-8 text-purple-600" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    </div>
  );
}
