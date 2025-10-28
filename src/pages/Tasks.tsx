import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Tasks = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Pending page by default
    navigate("/pending");
  }, [navigate]);

  return null;
};

export default Tasks;
