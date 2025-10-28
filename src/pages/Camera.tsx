import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";

const Camera = () => {
  const [cameraUrl, setCameraUrl] = useState("");

  useEffect(() => {
    const robotId = "AMSSTORES1-Nano";
    setCameraUrl(`https://amsstores1.leapmile.com:5970/tasks.html?robot_id=${robotId}`);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader selectedTab="" isCameraPage={true} />
      <main className="flex-1">
        {cameraUrl && (
          <iframe
            src={cameraUrl}
            className="w-full h-[calc(100vh-55px)]"
            title="Camera View"
          />
        )}
      </main>
    </div>
  );
};

export default Camera;
