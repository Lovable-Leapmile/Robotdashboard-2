import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Bot, Package, Layers, Zap } from "lucide-react";

interface RobotInfo {
  robot_name: string;
  robot_num_rows: number;
  robot_num_racks: number;
  robot_num_slots: number;
  robot_num_depths: number;
  updated_at: string;
}

interface SlotInfo {
  total: number;
  occupied: number;
  free: number;
  occupiedPercent: number;
}

interface TrayInfo {
  total: number;
  occupied: number;
  free: number;
  occupiedPercent: number;
}

interface PowerInfo {
  voltage: string;
  current: string;
  power: string;
  energy: string;
}

const API_BASE = "https://amsstores1.leapmile.com";
const AUTH_TOKEN = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2wiOiJhZG1pbiIsImV4cCI6MTkwMDY1MzE0M30.asYhgMAOvrau4G6LI4V4IbgYZ022g_GX0qZxaS57GQc";

export const DashboardCards = () => {
  const [robotInfo, setRobotInfo] = useState<RobotInfo | null>(null);
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [trayInfo, setTrayInfo] = useState<TrayInfo | null>(null);
  const [powerInfo, setPowerInfo] = useState<PowerInfo | null>(null);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  const fetchRobotInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/robotmanager/robots`, {
        headers: { "Authorization": AUTH_TOKEN }
      });
      const data = await response.json();
      if (data.records && data.records.length > 0) {
        setRobotInfo(data.records[0]);
      }
    } catch (error) {
      console.error("Error fetching robot info:", error);
    }
  };

  const fetchSlotInfo = async () => {
    try {
      const [slotsResponse, traysResponse] = await Promise.all([
        fetch(`${API_BASE}/robotmanager/slots_count?slot_status=active`, {
          headers: { "Authorization": AUTH_TOKEN }
        }),
        fetch(`${API_BASE}/robotmanager/trays?tray_status=active`, {
          headers: { "Authorization": AUTH_TOKEN }
        })
      ]);

      const slotsData = await slotsResponse.json();
      const traysData = await traysResponse.json();

      const total = slotsData.total_count || 0;
      const occupied = traysData.count || 0;
      const free = total - occupied;
      const occupiedPercent = total > 0 ? (occupied / total) * 100 : 0;

      setSlotInfo({ total, occupied, free, occupiedPercent });
    } catch (error) {
      console.error("Error fetching slot info:", error);
    }
  };

  const fetchTrayInfo = async () => {
    try {
      const [occupiedResponse, freeResponse] = await Promise.all([
        fetch(`${API_BASE}/nanostore/occupied_trays?occupied=true`, {
          headers: { "Authorization": AUTH_TOKEN }
        }),
        fetch(`${API_BASE}/nanostore/occupied_trays?occupied=false`, {
          headers: { "Authorization": AUTH_TOKEN }
        })
      ]);

      const occupiedData = await occupiedResponse.json();
      const freeData = await freeResponse.json();

      const occupied = occupiedData.countOccupied || 0;
      const free = freeData.countFree || 0;
      const total = occupied + free;
      const occupiedPercent = total > 0 ? (occupied / total) * 100 : 0;

      setTrayInfo({ total, occupied, free, occupiedPercent });
    } catch (error) {
      console.error("Error fetching tray info:", error);
    }
  };

  const fetchPowerInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/robotmanager/robot_power?today=true&num_records=1`, {
        headers: { "Authorization": AUTH_TOKEN }
      });
      const data = await response.json();
      
      if (data.records && data.records.length > 0) {
        const record = data.records[0];
        setPowerInfo({
          voltage: `${record.voltage} V`,
          current: `${record.current} A`,
          power: `${record.max_demand_active_power} kW`,
          energy: `${record.total_active_energy_kwh} kWh`
        });
      }
    } catch (error) {
      console.error("Error fetching power info:", error);
    }
  };

  const fetchAllData = () => {
    fetchRobotInfo();
    fetchSlotInfo();
    fetchTrayInfo();
    fetchPowerInfo();
  };

  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh every 1 hour
    const interval = setInterval(fetchAllData, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4" style={{ flex: 1 }}>
      {/* Robot Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5" style={{ color: '#351c75' }} />
            Robot Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {robotInfo ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{robotInfo.robot_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Rows:</span>
                <span className="font-medium">{robotInfo.robot_num_rows}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Racks:</span>
                <span className="font-medium">{robotInfo.robot_num_racks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Slots:</span>
                <span className="font-medium">{robotInfo.robot_num_slots}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Depth:</span>
                <span className="font-medium">{robotInfo.robot_num_depths}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Updated:</span>
                <span className="font-medium text-xs">{formatDateTime(robotInfo.updated_at)}</span>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">Loading...</div>
          )}
        </CardContent>
      </Card>

      {/* Slot Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" style={{ color: '#351c75' }} />
            Slot Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {slotInfo ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Slots:</span>
                <span className="font-medium">{slotInfo.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Occupied:</span>
                <span className="font-medium">{slotInfo.occupied}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Free:</span>
                <span className="font-medium">{slotInfo.free}</span>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Occupied</span>
                  <span className="font-medium">{slotInfo.occupiedPercent.toFixed(1)}%</span>
                </div>
                <Progress value={slotInfo.occupiedPercent} />
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">Loading...</div>
          )}
        </CardContent>
      </Card>

      {/* Tray Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5" style={{ color: '#351c75' }} />
            Tray Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {trayInfo ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Trays:</span>
                <span className="font-medium">{trayInfo.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Occupied:</span>
                <span className="font-medium">{trayInfo.occupied}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Free:</span>
                <span className="font-medium">{trayInfo.free}</span>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Occupied</span>
                  <span className="font-medium">{trayInfo.occupiedPercent.toFixed(1)}%</span>
                </div>
                <Progress value={trayInfo.occupiedPercent} />
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">Loading...</div>
          )}
        </CardContent>
      </Card>

      {/* Robot Power Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5" style={{ color: '#351c75' }} />
            Robot Power
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {powerInfo ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">⚡ Voltage:</span>
                <span className="font-medium">{powerInfo.voltage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">🔌 Current:</span>
                <span className="font-medium">{powerInfo.current}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">🔆 Power:</span>
                <span className="font-medium">{powerInfo.power}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">🔋 Energy:</span>
                <span className="font-medium">{powerInfo.energy}</span>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">Loading...</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
