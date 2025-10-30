import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import SlotDetailsPanel from "@/components/SlotDetailsPanel";
import blockImg from "@/assets/block.png";
import stationImg from "@/assets/station.png";
import trayImg from "@/assets/tray.png";

interface Slot {
  slot_id: string;
  slot_name: string;
  slot_status: string;
  tags: string[];
  tray_id: string | null;
}

interface SlotDetails extends Slot {
  slot_height: number;
  updated_at: string;
}

const Racks = () => {
  const [userName, setUserName] = useState("");
  const [numRacks, setNumRacks] = useState(0);
  const [numSlots, setNumSlots] = useState(0);
  const [numDepths, setNumDepths] = useState(0);
  const [selectedRack, setSelectedRack] = useState<number | null>(null);
  const [row1Depth1Slots, setRow1Depth1Slots] = useState<Slot[]>([]);
  const [row1Depth0Slots, setRow1Depth0Slots] = useState<Slot[]>([]);
  const [row0Depth1Slots, setRow0Depth1Slots] = useState<Slot[]>([]);
  const [row0Depth0Slots, setRow0Depth0Slots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [slotDetails, setSlotDetails] = useState<SlotDetails | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserName = localStorage.getItem("user_name");
    const storedUserId = localStorage.getItem("user_id");

    if (!storedUserName || !storedUserId) {
      navigate("/");
      return;
    }

    setUserName(storedUserName);
    
    // Load selected rack from localStorage
    const storedSelectedRack = localStorage.getItem("selected_rack");
    if (storedSelectedRack !== null) {
      setSelectedRack(parseInt(storedSelectedRack));
    }
    
    fetchRobotConfig();
  }, [navigate]);

  useEffect(() => {
    if (selectedRack !== null) {
      fetchAllSlots(selectedRack);
      
      // Set up polling interval for 2 seconds
      const intervalId = setInterval(() => {
        fetchAllSlots(selectedRack);
      }, 2000);
      
      // Cleanup interval on unmount or when selectedRack changes
      return () => clearInterval(intervalId);
    }
  }, [selectedRack]);

  const fetchRobotConfig = async () => {
    try {
      const response = await fetch("https://amsstores1.leapmile.com/robotmanager/robots", {
        method: "GET",
        headers: {
          "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2wiOiJhZG1pbiIsImV4cCI6MTkwMDY1MzE0M30.asYhgMAOvrau4G6LI4V4IbgYZ022g_GX0qZxaS57GQc",
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch robot configuration");
      }

      const data = await response.json();
      
      // Store robot configuration globally
      if (data.records && data.records.length > 0) {
        const robotConfig = data.records[0];
        const numRacksValue = robotConfig.robot_num_racks || 0;
        const numSlotsValue = robotConfig.robot_num_slots || 0;
        const numDepthsValue = robotConfig.robot_num_depths || 0;
        
        localStorage.setItem("robot_num_rows", robotConfig.robot_num_rows?.toString() || "0");
        localStorage.setItem("robot_num_racks", numRacksValue.toString());
        localStorage.setItem("robot_num_slots", numSlotsValue.toString());
        localStorage.setItem("robot_num_depths", numDepthsValue.toString());
        
        setNumRacks(numRacksValue);
        setNumSlots(numSlotsValue);
        setNumDepths(numDepthsValue);
        
        console.log("Robot configuration stored globally:", {
          robot_num_rows: robotConfig.robot_num_rows,
          robot_num_racks: numRacksValue,
          robot_num_slots: numSlotsValue,
          robot_num_depths: numDepthsValue
        });
      }
    } catch (error) {
      console.error("Error fetching robot configuration:", error);
    }
  };

  const sortSlotsByIdDescending = (slots: Slot[]) => {
    return [...slots].sort((a, b) => {
      const aNum = parseInt(a.slot_id.split('-')[1] || '0');
      const bNum = parseInt(b.slot_id.split('-')[1] || '0');
      return bNum - aNum; // Descending order
    });
  };

  const fetchAllSlots = async (rackValue: number) => {
    const authToken = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2wiOiJhZG1pbiIsImV4cCI6MTkwMDY1MzE0M30.asYhgMAOvrau4G6LI4V4IbgYZ022g_GX0qZxaS57GQc";
    
    try {
      const [res1, res2, res3, res4] = await Promise.all([
        fetch(`https://amsstores1.leapmile.com/robotmanager/slots?row=1&depth=1&rack=${rackValue}`, {
          headers: { "Authorization": authToken, "Content-Type": "application/json" }
        }),
        fetch(`https://amsstores1.leapmile.com/robotmanager/slots?row=1&depth=0&rack=${rackValue}`, {
          headers: { "Authorization": authToken, "Content-Type": "application/json" }
        }),
        fetch(`https://amsstores1.leapmile.com/robotmanager/slots?row=0&depth=1&rack=${rackValue}`, {
          headers: { "Authorization": authToken, "Content-Type": "application/json" }
        }),
        fetch(`https://amsstores1.leapmile.com/robotmanager/slots?row=0&depth=0&rack=${rackValue}`, {
          headers: { "Authorization": authToken, "Content-Type": "application/json" }
        })
      ]);

      const [data1, data2, data3, data4] = await Promise.all([
        res1.json(),
        res2.json(),
        res3.json(),
        res4.json()
      ]);

      setRow1Depth1Slots(sortSlotsByIdDescending(data1.records || []));
      setRow1Depth0Slots(sortSlotsByIdDescending(data2.records || []));
      setRow0Depth1Slots(sortSlotsByIdDescending(data3.records || []));
      setRow0Depth0Slots(sortSlotsByIdDescending(data4.records || []));
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  const handleRackSelect = (index: number) => {
    setSelectedRack(index);
    localStorage.setItem("selected_rack", index.toString());
    setSelectedSlotId(null);
    setSlotDetails(null);
  };

  const fetchSlotDetails = async (slotId: string) => {
    const authToken = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2wiOiJhZG1pbiIsImV4cCI6MTkwMDY1MzE0M30.asYhgMAOvrau4G6LI4V4IbgYZ022g_GX0qZxaS57GQc";
    
    try {
      const response = await fetch(`https://amsstores1.leapmile.com/robotmanager/slots?slot_id=${slotId}`, {
        headers: { 
          "Authorization": authToken, 
          "Content-Type": "application/json" 
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch slot details");
      }

      const data = await response.json();
      if (data.records && data.records.length > 0) {
        setSlotDetails(data.records[0]);
      }
    } catch (error) {
      console.error("Error fetching slot details:", error);
    }
  };

  const handleSlotClick = (slotId: string) => {
    setSelectedSlotId(slotId);
    fetchSlotDetails(slotId);
  };

  // Auto-refresh slot details every 3 seconds when a slot is selected
  useEffect(() => {
    if (selectedSlotId) {
      const intervalId = setInterval(() => {
        fetchSlotDetails(selectedSlotId);
      }, 3000);
      
      return () => clearInterval(intervalId);
    }
  }, [selectedSlotId]);

  const SlotBox = ({ slot }: { slot: Slot }) => {
    const isInactive = slot.slot_status === "inactive";
    const isSelected = selectedSlotId === slot.slot_id;
    
    return (
      <div 
        onClick={() => !isInactive && handleSlotClick(slot.slot_id)}
        className={`relative flex flex-col items-center justify-center border rounded transition-all ${
          isInactive ? 'cursor-default' : 'cursor-pointer hover:shadow-md'
        }`}
        style={{ 
          width: '150px', 
          height: '50px',
          borderColor: isSelected ? '#351c75' : '#d1d5db',
          borderWidth: isSelected ? '2px' : '1px',
          backgroundColor: isSelected ? '#f3f0ff' : 'white'
        }}
      >
        {isInactive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={blockImg} alt="Inactive" className="w-full h-full object-cover rounded" />
          </div>
        )}
        <div className="text-xs font-medium relative z-10" style={{ color: '#351c75' }}>
          {slot.slot_id}
        </div>
        {!isInactive && (
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-1" style={{ gap: '1px' }}>
            {slot.tags?.includes("station") && (
              <img src={stationImg} alt="Station" style={{ width: '146px', height: '10px' }} />
            )}
            {slot.tray_id && (
              <img src={trayImg} alt="Tray" style={{ width: '146px', height: '10px' }} />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <AppHeader selectedTab="Racks" />
      
      <div style={{ height: '10px' }} />
      
      <main className="p-6" style={{ marginLeft: '15px', marginRight: '15px' }}>
        {/* Row 1 Section */}
        <div className="mb-8">
          <div className="text-xl font-semibold mb-4" style={{ color: '#351c75' }}>
            Row 1
          </div>
          <div className="flex" style={{ gap: '10px' }}>
            {Array.from({ length: numDepths }, (_, depthIndex) => (
              <div key={`row1-depth${depthIndex}`} className="flex flex-col" style={{ gap: '5px' }}>
                {Array.from({ length: numRacks }, (_, rackIndex) => (
                  <div
                    key={`row1-depth${depthIndex}-rack${rackIndex}`}
                    className="flex items-center justify-center font-medium text-xs border rounded"
                    style={{
                      width: '75px',
                      height: '25px',
                      backgroundColor: '#ffffff',
                      color: '#351C75',
                      borderColor: '#d1d5db',
                      borderWidth: '1px'
                    }}
                  >
                    R{rackIndex}-D{depthIndex}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Row 0 Section */}
        <div>
          <div className="text-xl font-semibold mb-4" style={{ color: '#351c75' }}>
            Row 0
          </div>
          <div className="flex" style={{ gap: '10px' }}>
            {Array.from({ length: numDepths }, (_, depthIndex) => (
              <div key={`row0-depth${depthIndex}`} className="flex flex-col" style={{ gap: '5px' }}>
                {Array.from({ length: numRacks }, (_, rackIndex) => (
                  <div
                    key={`row0-depth${depthIndex}-rack${rackIndex}`}
                    className="flex items-center justify-center font-medium text-xs border rounded"
                    style={{
                      width: '75px',
                      height: '25px',
                      backgroundColor: '#ffffff',
                      color: '#351C75',
                      borderColor: '#d1d5db',
                      borderWidth: '1px'
                    }}
                  >
                    R{rackIndex}-D{depthIndex}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Racks;
