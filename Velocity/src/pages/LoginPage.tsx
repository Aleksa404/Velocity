import { Navigate, useLocation } from "react-router";
import Login from "../components/Login";
import { useUserStore } from "../stores/userStore";

function LoginPage() {
  const user = useUserStore((state) => state.user);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const from = searchParams.get("from") ?? "/";

  if (user) {
    return <Navigate to={from} replace />;
  } else return <Login />;
}

export default LoginPage;
