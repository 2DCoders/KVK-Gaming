import { Alert } from "@/components/ui/alert";
import { createGamingStation, getGamingStationsByCategory, updateGamingStation } from "@/services/gaming-stations-api";
import { createSlotConfiguration, getSlotConfigurationByCategory, updateSlotConfiguration } from "@/services/slots-api";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

export default function PCSettings() {
  const [pcs, setPcs] = useState<any[]>([]);
  const [selectedPc, setSelectedPc] = useState<any>(null);
  const [pageAlert, setPageAlert] = useState<{
    visible: boolean;
    variant?: "success" | "error" | "warning" | "info";
    title?: string;
    description?: string;
  }>({ visible: false });

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState(true);

  const [id, setId] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("22:00");
  const [duration, setDuration] = useState(60);
  const [gap, setGap] = useState(0);
  const [isConfigure, setIsConfigure] = useState(false);

  const categories = localStorage.getItem("categories")
    ? JSON.parse(localStorage.getItem("categories") as string)
    : [];

      const navigate = useNavigate();

  const dayendData = localStorage.getItem("dayEndData") ? JSON.parse(localStorage.getItem("dayEndData") as string) : null;

  useEffect(() => {
    if (!dayendData) {
      navigate("/dayend");
    }
  }, [dayendData]);

  const pcCategory = categories.find(
    (category: any) => category.name === "PC"
  );

  const pcCategoryId = pcCategory?.id;

  const handleGetPCs = async () => {
    if (!pcCategoryId) {
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Error",
        description: "PC category not found. Please ensure it exists.",
      });
      return;
    }

    try {
      const response = await getGamingStationsByCategory(pcCategoryId);
      setPcs(response);
    } catch (error) {
      console.error("Error fetching PCs:", error);
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Error",
        description: "Failed to fetch PCs.",
      });
    }
  }

  const handleCreatePC = async () => {
    if (!pcCategoryId) {
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Error",
        description: "PC category not found. Please ensure it exists.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await createGamingStation({
        name,
        gamingCategoryId: pcCategoryId,
        isActive: status,
        stationCode: name.toUpperCase().replace(/\s+/g, "_"),
      });
      console.log("PC created successfully:", response);
      setPageAlert({
        visible: true,
        variant: "success",
        title: "PC Created",
        description: "The PC has been created successfully."
      });
      setName("");
      setStatus(true);
      handleGetPCs();
    } catch (error) {
      console.error("Error creating PC:", error);
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Error",
        description: "Failed to create PC."
      });
    } finally {
      setLoading(false);
    }
  }

  const handleUpdatePC = async () => {
    if (!selectedPc) {
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Error",
        description: "No PC selected for update.",
      });
      return;
    }

    setLoading(true);

    try {
      await updateGamingStation({
        id: selectedPc.id,
        gamingCategoryId: pcCategoryId,
        stationCode: selectedPc.stationCode,
        name,
        isActive: status,
      });
      setPageAlert({
        visible: true,
        variant: "success",
        title: "PC Updated",
        description: "The PC has been updated successfully."
      });
      setSelectedPc(null);
      setName("");
      setStatus(true);
      handleGetPCs();
    } catch (error) {
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Error",
        description: "Failed to update PC."
      });
    } finally {
      setLoading(false);
    }
  }

  const handleGetSlotConfiguration = async () => {
    if (!pcCategoryId) {
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Error",
        description: "PC category not found. Please ensure it exists.",
      });
      return;
    }

    try {
      const response = await getSlotConfigurationByCategory(pcCategoryId);
      console.log("Fetched slot configuration:", response);
      setStartTime(response.startTime);
      setEndTime(response.endTime);
      setDuration(response.duration);
      setGap(response.gap);
      setId(response.id);
      setIsConfigure(true);
    } catch (error) {
      setStartTime("09:00");
      setEndTime("22:00");
      setDuration(60);
      setGap(0);
      setIsConfigure(false);
    }
  }

  const handleUpdateSlotConfiguration = async (id: string) => {
    if (!pcCategoryId) {
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Error",
        description: "PC category not found. Please ensure it exists.",
      });
      return;
    }

    setLoading(true);

    try {
      await updateSlotConfiguration({
        id: id,
        gamingCategoryId: pcCategoryId,
        startTime,
        endTime,
        slotDurationMinutes: duration,
        slotGapMinutes: gap,
        isActive: 1,
        price: 0
      });
      setPageAlert({
        visible: true,
        variant: "success",
        title: "Slot Configuration Updated",
        description: "The slot configuration has been updated successfully."
      });
      handleGetSlotConfiguration();
    } catch (error) {
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Error",
        description: "Failed to update slot configuration."
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCreateSlotConfiguration = async () => {
    if (!pcCategoryId) {
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Error",
        description: "PC category not found. Please ensure it exists.",
      });
      return;
    }

    setLoading(true);

    try {
      await createSlotConfiguration({
        gamingCategoryId: pcCategoryId,
        startTime,
        endTime,
        slotDurationMinutes: duration,
        slotGapMinutes: gap,
        isActive: 1,
      });

      setPageAlert({
        visible: true,
        variant: "success",
        title: "Slot Configuration Created",
        description: "The slot configuration has been created successfully."
      });
      handleGetSlotConfiguration();
    } catch (error) {
      console.error("Error creating slot configuration:", error);
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Error",
        description: "Failed to create slot configuration."
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleGetPCs();
    handleGetSlotConfiguration();
  }, [pcCategoryId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      {pageAlert.visible && (
        <div>
          <Alert
            variant={pageAlert.variant as any}
            title={pageAlert.title}
            description={pageAlert.description}
            onClose={() => setPageAlert((s) => ({ ...s, visible: false }))}
          />
        </div>
      )}

      {loading && createPortal(
        <div className="fixed inset-0 z-[9999999999] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
            <p className="text-sm text-white font-medium">Loading</p>
          </div>
        </div>,
        document.body
      )}
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">PC Settings</h1>
      </div>

      {/* PC Configuration */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-6">PC Configuration</h2>

          <div className="space-y-5 grid md:grid-cols-1 gap-5">
            <div>
              <label className="text-sm text-gray-600 block mb-2">
                PC Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-200 px-3"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-2">Status</label>

              <button
                onClick={() => setStatus(!status)}
                className={`
              relative w-12 h-6 rounded-full transition-all cursor-pointer
              ${status ? "bg-green-500" : "bg-gray-300"}
            `}
              >
                <span
                  className={`
                absolute top-0.5 left-0.5
                w-5 h-5 bg-white rounded-full
                transition-transform
                ${status ? "translate-x-6" : ""}
              `}
                />
              </button>
            </div>

            <div className="flex justify-end">
              {selectedPc ? (
                <>
                  {/* need reset button */}
                  <button
                    onClick={() => {
                      setSelectedPc(null);
                      setName("");
                      setStatus(true);
                    }}
                    className="
                h-11 px-5 rounded-xl
                cursor-pointer
                bg-gray-200
                text-gray-700
                mr-3
              "
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      handleUpdatePC();
                    }}
                    disabled={!name}
                    className="
                h-11 px-5 rounded-xl
                cursor-pointer
                bg-gradient-to-r
                from-red-500
                via-red-600
                to-red-700
                text-white
                disabled:opacity-50
              "
                  >
                    Update PC
                  </button>
                </>

              ) : (
                <button
                  onClick={() => {
                    handleCreatePC();
                  }}
                  disabled={!name}
                  className="
                h-11 px-5 rounded-xl
                cursor-pointer
                bg-gradient-to-r
                from-red-500
                via-red-600
                to-red-700
                text-white
                disabled:opacity-50
              "
                >
                  Create PC
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PC List */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">PC List</h2>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-2">
            {pcs.map((pc) => (
              <button
                key={pc.id}
                onClick={() => {
                  setSelectedPc(pc);
                  setName(pc.name);
                  setStatus(pc.isActive);
                }}
                className={`
              w-full p-3 rounded-xl border
              text-left transition-all
              cursor-pointer
              hover:bg-gray-50
              ${selectedPc?.id === pc.id
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200"
                  }
            `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{pc.name}</span>

                  <span
                    className={`
                  px-2 py-1 rounded-full text-xs
                  ${pc.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                      }
                `}
                  >
                    {pc.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Slot Configuration */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">PC Slot Configuration</h2>
        </div>

        {!isConfigure ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No slot configuration available.Create a new slot configuration to get started.</p>
          </div>
        ) : null}

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm text-gray-600 block mb-2">
              Start Time
            </label>

            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full h-11 rounded-xl border border-gray-200 px-3"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">End Time</label>

            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full h-11 rounded-xl border border-gray-200 px-3"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">
              Duration (Minutes)
            </label>

            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-11 rounded-xl border border-gray-200 px-3"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">
              Gap (Minutes)
            </label>

            <input
              type="number"
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              className="w-full h-11 rounded-xl border border-gray-200 px-3"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          {!isConfigure ? (
            <button
              onClick={() => {
                handleCreateSlotConfiguration();
              }}
              className="
          h-11 px-5 rounded-xl
          bg-gradient-to-r
          from-red-500
          via-red-600
          to-red-700
          text-white
          cursor-pointer
        "
            >
              Create Configuration
            </button>
          ) : (
            <button
              onClick={() => {
                handleUpdateSlotConfiguration(id);
              }}
              className="
          h-11 px-5 rounded-xl
          bg-gradient-to-r
          from-red-500
          via-red-600
          to-red-700
          text-white
          cursor-pointer
        "
            >
              Update Configuration
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
