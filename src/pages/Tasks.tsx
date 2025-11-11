import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Tasks = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Completed page by default
    navigate("/completed");
  }, [navigate]);

  return null;
};

export default Tasks;
