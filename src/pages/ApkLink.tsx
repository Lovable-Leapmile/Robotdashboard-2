import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";

const ApkLink = () => {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserName = localStorage.getItem("user_name");
    const storedUserId = localStorage.getItem("user_id");

    if (!storedUserName || !storedUserId) {
      navigate("/");
      return;
    }

    setUserName(storedUserName);
  }, [navigate]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <AppHeader selectedTab="APK Link" />
      
      <main className="p-6">
        <div className="w-full bg-white rounded-lg shadow-sm" style={{ height: 'calc(100vh - 180px)' }}>
          <iframe
            src="https://amsstores1.leapmile.com:5570/index.html"
            className="w-full h-full rounded-lg"
            title="APK Link Preview"
            style={{ border: 'none' }}
          />
        </div>
      </main>
    </div>
  );
};

export default ApkLink;
