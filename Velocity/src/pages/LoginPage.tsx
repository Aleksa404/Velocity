import { Navigate } from "react-router";
import Login from "../components/Login";
import { useUserStore } from "../stores/userStore";

function LoginPage() {
  const user = useUserStore((state) => state.user);

  if (user) {
    return <Navigate to="/" replace />;
  } else return <Login />;
}

export default LoginPage;
