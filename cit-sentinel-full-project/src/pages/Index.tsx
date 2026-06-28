import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/LoginPage";
import DashboardLayout from "@/components/DashboardLayout";
import StudentView from "@/components/views/StudentView";
import TeacherView from "@/components/views/TeacherView";
import MentorView from "@/components/views/MentorView";
import HODView from "@/components/views/HODView";
import PrincipalView from "@/components/views/PrincipalView";
import ChairmanView from "@/components/views/ChairmanView";

export default function Index() {
  const { user } = useAuth();

  if (!user) return <LoginPage />;

  const viewMap: Record<string, JSX.Element> = {
    "Student": <StudentView />,
    "Subject Teacher": <TeacherView />,
    "Mentor": <MentorView />,
    "HOD": <HODView />,
    "Principal": <PrincipalView />,
    "Chairman": <ChairmanView />,
  };

  return (
    <DashboardLayout user={user}>
      {viewMap[user.role] || <div className="p-8 text-center text-muted-foreground">Invalid Role View</div>}
    </DashboardLayout>
  );
}
