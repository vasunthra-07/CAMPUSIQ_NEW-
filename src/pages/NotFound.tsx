import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
        <p className="mb-2 text-xl font-semibold text-foreground">Page not found</p>
        <p className="mb-6 text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-secondary px-4 py-2 rounded-lg text-sm">Go Back</button>
          <button onClick={() => navigate("/app")} className="btn-primary px-4 py-2 rounded-lg text-sm">Go to Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
