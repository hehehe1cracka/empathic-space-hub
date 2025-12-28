import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Users } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="h-20 w-20 rounded-2xl gradient-calm flex items-center justify-center mx-auto mb-6 shadow-glow">
          <Users className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-muted-foreground mb-8">Page not found. Let's get you back.</p>
        <Button asChild className="gradient-calm">
          <Link to="/"><Home className="h-4 w-4 mr-2" />Back to Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
