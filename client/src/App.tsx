import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Create from "./pages/Create";
import Login from "./pages/Login";
import Templates from "./pages/Templates";
import Gallery from "./pages/Gallery";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import MyWorks from "./pages/MyWorks";
import AccountSettings from "./pages/AccountSettings";


function Router() {
  return (
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
