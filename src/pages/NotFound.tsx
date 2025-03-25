
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tighter">404</h1>
          <p className="text-xl text-muted-foreground">
            This page doesn't exist or was recently moved.
          </p>
        </div>
        <Button asChild className="mt-8 animate-fade-in">
          <a href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            Return to Dashboard
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
