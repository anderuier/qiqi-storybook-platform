import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { RouteLoading } from "./components/RouteLoading";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";

// 路由懒加载：将页面组件拆分为独立 chunk，按需加载
// 这样可以减少首屏 JS 体积，提升首屏加载速度
const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("./pages/Home"));
const Create = lazy(() => import("./pages/Create"));
const Login = lazy(() => import("./pages/Login"));
const Templates = lazy(() => import("./pages/Templates"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Help = lazy(() => import("./pages/Help"));
const Contact = lazy(() => import("./pages/Contact"));
const MyWorks = lazy(() => import("./pages/MyWorks"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));


function Router() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/create"} component={Create} />
        <Route path={"/login"} component={Login} />
        <Route path={"/templates"} component={Templates} />
        <Route path={"/gallery"} component={Gallery} />
        <Route path={"/help"} component={Help} />
        <Route path={"/contact"} component={Contact} />
        <Route path={"/my-works"} component={MyWorks} />
        <Route path={"/settings"} component={AccountSettings} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
