import { Navigate } from "react-router";
import Register from "../components/Register";
import { useUserStore } from "../stores/userStore";

const LoginPage = () => {
  const user = useUserStore((state) => state.user);

  if (user) {
    return <Navigate to="/" replace />;
  } else return <Register />;
};

export default LoginPage;
