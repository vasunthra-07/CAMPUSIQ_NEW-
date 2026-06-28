import { useAuth } from "@/context/AuthContext";
import CampusCommandCenter from "./CampusCommandCenter";

export default function Overview() {
  const { user } = useAuth();
  if (!user) return null;
  return <CampusCommandCenter />;
}
