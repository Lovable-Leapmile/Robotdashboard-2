import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Bot, Package, Layers, Zap, Activity, Flame, Battery } from "lucide-react";
import { getRobotManagerBase, getNanostoreBase } from "@/lib/api";
import { getStoredAuthToken } from "@/lib/auth";

interface RobotInfo {
  robot_name: string;
  robot_num_rows: number;
  robot_num_racks: number;
  robot_num_slots: number;
  robot_num_depths: number;
  updated_at: string;
}

interface SlotInfo {
  totalSlots: number;
  occupiedSlots: number;
  freeSlots: number;
  occupiedPercent: number;
}

interface TrayInfo {
  totalTrays: number;
  occupiedTrays: number;
  freeTrays: number;
  occupiedPercent: number;
}

interface PowerInfo {
  voltage: string;
  current: string;
  power: string;
  energy: string;
  updatedAt: string | null;
}

export const DashboardCards = () => {
  const [robotInfo, setRobotInfo] = useState<RobotInfo | null>(null);
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [trayInfo, setTrayInfo] = useState<TrayInfo | null>(null);
  const [powerInfo, setPowerInfo] = useState<PowerInfo | null>(null);

  const formatToIST = (dateString: string): string => {
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
      const token = getStoredAuthToken();
      if (!token) return;
      const response = await fetch(`${getRobotManagerBase()}/robots`, {
        headers: { "Authorization": token, "Content-Type": "application/json" }
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
      const token = getStoredAuthToken();
      if (!token) return;
      const [slotsResponse, traysResponse] = await Promise.all([
        fetch(`${getRobotManagerBase()}/slots_count?slot_status=active`, {
          headers: { "Authorization": token, "Content-Type": "application/json" }
        }),
        fetch(`${getRobotManagerBase()}/trays?tray_status=active`, {
          headers: { "Authorization": token, "Content-Type": "application/json" }
        })
      ]);

      const slotsData = await slotsResponse.json();
      const traysData = await traysResponse.json();

      const totalSlots = slotsData.records?.[0]?.total_count || 0;
      const occupiedSlots = traysData.records ? traysData.records.length : 0;
      const freeSlots = totalSlots - occupiedSlots;
      const occupiedPercent = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

      setSlotInfo({ totalSlots, occupiedSlots, freeSlots, occupiedPercent });
    } catch (error) {
      console.error("Error fetching slot info:", error);
    }
  };

  const fetchTrayInfo = async () => {
    try {
      const token = getStoredAuthToken();
      if (!token) return;
      const [occupiedResponse, freeResponse] = await Promise.all([
        fetch(`${getNanostoreBase()}/occupied_trays?occupied=true`, {
          headers: { "Authorization": token, "Content-Type": "application/json" }
        }),
        fetch(`${getNanostoreBase()}/occupied_trays?occupied=false`, {
          headers: { "Authorization": token, "Content-Type": "application/json" }
        })
      ]);

      const occupiedData = await occupiedResponse.json();
      const freeData = await freeResponse.json();

      const occupiedTrays = occupiedData.records?.[0]?.count || 0;
      const freeTrays = freeData.records?.[0]?.count || 0;
      const totalTrays = occupiedTrays + freeTrays;
      const occupiedPercent = totalTrays > 0 ? (occupiedTrays / totalTrays) * 100 : 0;

      setTrayInfo({ totalTrays, occupiedTrays, freeTrays, occupiedPercent });
    } catch (error) {
      console.error("Error fetching tray info:", error);
    }
  };

  const fetchPowerInfo = async () => {
    try {
      const token = getStoredAuthToken();
      if (!token) return;
      // First try to fetch today's data
      let response = await fetch(`${getRobotManagerBase()}/robot_power?today=true&num_records=1`, {
        headers: { "Authorization": token, "Content-Type": "application/json" }
      });
      let data = await response.json();
      
      // If today's data is not available, fetch the most recent data regardless of date
      if (data.status !== "success" || !data.records || data.records.length === 0) {
        response = await fetch(`${getRobotManagerBase()}/robot_power?num_records=1`, {
          headers: { "Authorization": token, "Content-Type": "application/json" }
        });
        data = await response.json();
      }
      
      if (data.status === "success" && data.records && data.records.length > 0) {
        const record = data.records[0];
        setPowerInfo({
          voltage: `${record.voltage ?? 'N/A'} V`,
          current: `${record.current ?? 'N/A'} A`,
          power: `${record.max_demand_active_power ?? 'N/A'} kW`,
          energy: `${record.total_active_energy_kwh ?? 'N/A'} kWh`,
          updatedAt: record.updated_at || null
        });
      } else {
        // No data available at all
        setPowerInfo({
          voltage: "N/A",
          current: "N/A",
          power: "N/A",
          energy: "N/A",
          updatedAt: null
        });
      }
    } catch (error) {
      console.error("Error fetching power info:", error);
      setPowerInfo({
        voltage: "N/A",
        current: "N/A",
        power: "N/A",
        energy: "N/A",
        updatedAt: null
      });
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
    const interval = setInterval(fetchAllData, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-1.5 mt-2">
      {/* Robot Information */}
      <div className="flex-1 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-2">
        <div className="flex items-center gap-1.5 mb-1.5 border-b border-primary/15 pb-1">
          <Bot className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-bold text-primary">Robot</span>
        </div>
        {robotInfo ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Name</span>
              <span className="font-semibold text-primary truncate ml-1 max-w-[80px]">{robotInfo.robot_name}</span>
            </div>
            <div className="grid grid-cols-4 gap-0.5">
              {[
                { label: "R", value: robotInfo.robot_num_rows },
                { label: "K", value: robotInfo.robot_num_racks },
                { label: "S", value: robotInfo.robot_num_slots },
                { label: "D", value: robotInfo.robot_num_depths },
              ].map((item) => (
                <div key={item.label} className="text-center py-0.5 bg-background/60 rounded">
                  <div className="text-[8px] text-muted-foreground">{item.label}</div>
                  <div className="text-xs font-bold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-center text-[10px]">Loading...</div>
        )}
      </div>

      {/* Slot Information */}
      <div className="flex-1 bg-gradient-to-r from-blue-500/5 to-blue-500/10 border border-blue-500/20 rounded-lg p-2">
        <div className="flex items-center gap-1.5 mb-1.5 border-b border-blue-500/15 pb-1">
          <Package className="w-3 h-3 text-blue-600" />
          <span className="text-[10px] font-bold text-blue-600">Slots</span>
        </div>
        {slotInfo ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-foreground">{slotInfo.totalSlots}</span>
                <span className="text-[8px] text-muted-foreground">total</span>
              </div>
              <div className="flex gap-1.5 text-[9px]">
                <span className="text-blue-600 font-semibold">{slotInfo.occupiedSlots} occ</span>
                <span className="text-green-600 font-semibold">{slotInfo.freeSlots} free</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Progress value={slotInfo.occupiedPercent} className="h-1 flex-1" />
              <span className="text-[9px] font-semibold text-foreground w-8">{slotInfo.occupiedPercent.toFixed(0)}%</span>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-center text-[10px]">Loading...</div>
        )}
      </div>

      {/* Tray Information */}
      <div className="flex-1 bg-gradient-to-r from-purple-500/5 to-purple-500/10 border border-purple-500/20 rounded-lg p-2">
        <div className="flex items-center gap-1.5 mb-1.5 border-b border-purple-500/15 pb-1">
          <Layers className="w-3 h-3 text-purple-600" />
          <span className="text-[10px] font-bold text-purple-600">Trays</span>
        </div>
        {trayInfo ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-foreground">{trayInfo.totalTrays}</span>
                <span className="text-[8px] text-muted-foreground">total</span>
              </div>
              <div className="flex gap-1.5 text-[9px]">
                <span className="text-purple-600 font-semibold">{trayInfo.occupiedTrays} occ</span>
                <span className="text-green-600 font-semibold">{trayInfo.freeTrays} free</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Progress value={trayInfo.occupiedPercent} className="h-1 flex-1" />
              <span className="text-[9px] font-semibold text-foreground w-8">{trayInfo.occupiedPercent.toFixed(0)}%</span>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-center text-[10px]">Loading...</div>
        )}
      </div>

      {/* Power Information */}
      <div className="flex-1 bg-gradient-to-r from-amber-500/5 to-amber-500/10 border border-amber-500/20 rounded-lg p-2">
        <div className="flex items-center gap-1.5 mb-1.5 border-b border-amber-500/15 pb-1">
          <Zap className="w-3 h-3 text-amber-600" />
          <span className="text-[10px] font-bold text-amber-600">Power</span>
        </div>
        {powerInfo ? (
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-0.5"><Zap className="w-2 h-2" />V</span>
              <span className="font-semibold text-foreground">{powerInfo.voltage}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-0.5"><Activity className="w-2 h-2" />A</span>
              <span className="font-semibold text-foreground">{powerInfo.current}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-0.5"><Flame className="w-2 h-2" />P</span>
              <span className="font-semibold text-amber-600">{powerInfo.power}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-0.5"><Battery className="w-2 h-2" />E</span>
              <span className="font-semibold text-green-600">{powerInfo.energy}</span>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-center text-[10px]">Loading...</div>
        )}
      </div>
    </div>
  );
};
