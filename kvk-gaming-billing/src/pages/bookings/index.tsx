import { useEffect, useState } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { getCategories } from "@/services/categories-api";
import { getNextWorkingDays } from "@/services/holiday-api";
import { getGamingStationsByCategory } from "@/services/gaming-stations-api";
import { getSlotsAvailability } from "@/services/slots-api";
import { multiHoldBooking } from "@/services/bookings-api";
import { useNavigate } from "react-router-dom";

export default function Bookings() {
  const [selectedDate, setSelectedDate] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState(categories[0]?.id || "");
  const [days, setDays] = useState<{ label: string; day: number; date: string }[]>([]);
  const [gamingStations, setGamingStations] = useState<any[]>([]);
  const [slotsAvailability, setSlotsAvailability] = useState<any[]>([]);
  const [selectedGamingStation, setSelectedGamingStation] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);

    const date = new Date();
    date.setHours(hours, minutes, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const navigate = useNavigate();

  const dayendData = localStorage.getItem("dayEndData") ? JSON.parse(localStorage.getItem("dayEndData") as string) : null;

  useEffect(() => {
    if (!dayendData) {
      navigate("/dayend");
    }
  }, [dayendData]);

  const toggleSlot = (slotId: string) => {
    const slotIndex = slotsAvailability.findIndex((s) => s.id === slotId);

    setSelectedSlots((prev) => {
      const existing = [...prev];

      // Deselect
      if (existing.includes(slotId)) {
        return existing.filter((id) => id !== slotId);
      }

      // First selection
      if (existing.length === 0) {
        return [slotId];
      }

      const indexes = existing.map((id) =>
        slotsAvailability.findIndex((s) => s.id === id)
      );

      const min = Math.min(...indexes);
      const max = Math.max(...indexes);

      // Allow selecting only the previous or next slot
      if (slotIndex === min - 1 || slotIndex === max + 1) {
        return [...existing, slotId];
      }

      return prev;
    });
  };

  const isSelected = (slotId: string) => selectedSlots.includes(slotId);

  const handleGetNextWorkingDays = async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const startDate = yesterday.toISOString().split("T")[0];

    try {
      const workingDays = await getNextWorkingDays(startDate, 7);

      const mappedDays = workingDays.map(
        (dateString: string, index: number) => {
          const date = new Date(dateString);

          return {
            label:
              index === 0
                ? "Today"
                : date.toLocaleDateString("en-US", {
                  weekday: "short",
                }),
            day: date.getDate(),
            date: dateString,
          };
        }
      );

      setDays(mappedDays);
      return mappedDays;
    } catch (error) {
      console.error("Error fetching next working days:", error);
    }
  };

  const handleGetCategories = async (
    workingDays: { label: string; day: number; date: string }[]
  ) => {
    try {
      const response = await getCategories();

      setCategories(response);

      if (response.length > 0) {
        setSelectedStation(response[0].id);

        handleGetGamingStations(response[0].id, workingDays[0].date);
      }
    } catch {
      setCategories([]);
    }
  };

  const handleGetGamingStations = async (
    categoryId: string,
    date: string
  ) => {
    const response = await getGamingStationsByCategory(categoryId);

    setGamingStations(response);

    if (response.length > 0) {
      const firstStation = response[0];

      setSelectedGamingStation(firstStation.id);

      handleGetSlotsAvailability(
        firstStation.id,
        categoryId,
        date
      );
    }
  };

  const handleBooking = async () => {
    if (!selectedGamingStation || selectedSlots.length === 0) {
      alert("Please select at least one slot.");
      return;
    }

    try {
      const bookingDate = days[selectedDate].date.split("T")[0];

      const bookings = selectedSlots.map((slotId) => ({
        gamingCategoryId: selectedStation,
        gamingStationId: selectedGamingStation,
        gamingSlotId: slotId,
        bookingDate,
      }));

      const request = {
        bookings,
        totalAmount,
        paymentTypes: 0,
      };

      console.log(request);

      await multiHoldBooking(request);
    } catch (error) {
      console.error("Error booking slots:", error);
    }
  };

  const handleGetSlotsAvailability = async (
    stationId: string,
    categoryId: string,
    date: string
  ) => {
    try {
      const response = await getSlotsAvailability(
        stationId,
        categoryId,
        date
      );

      const now = new Date();
      const bookingDate = date.split("T")[0];
      const isToday = bookingDate === now.toISOString().split("T")[0];

      const mappedSlots = response.map((slot: any) => {
        let status: "available" | "booked" | "past" = "available";

        if (slot.isBooked) {
          status = "booked";
        } else if (isToday) {
          const slotDateTime = new Date(`${bookingDate}T${slot.startTime}`);

          if (slotDateTime <= now) {
            status = "past";
          }
        }

        return {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          time: formatTime(slot.startTime),
          status,
          price: slot.price,
        };
      });

      setSlotsAvailability(mappedSlots);
    } catch {
      setSlotsAvailability([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      const workingDays = await handleGetNextWorkingDays();
      await handleGetCategories(workingDays);
    };

    load();
  }, []);

  const selectedSlotObjects = slotsAvailability.filter((slot) =>
    selectedSlots.includes(slot.id)
  );

  const totalHours = selectedSlotObjects.length;

  const rate =
    selectedSlotObjects.length > 0
      ? selectedSlotObjects[0].price
      : 0;

  const totalAmount = selectedSlotObjects.reduce(
    (sum, slot) => sum + slot.price,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Gaming Booking
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Select your gaming station and reserve consecutive time slots.
          </p>
        </div>

        <div className="w-full md:w-72">
          <select
            value={selectedStation}
            onChange={(e) => {
              const categoryId = e.target.value;

              setSelectedStation(categoryId);
              setSelectedGamingStation("");
              setSelectedSlots([]);

              handleGetGamingStations(
                categoryId,
                days[selectedDate].date
              );
            }}
            className="w-full h-11 rounded-xl border border-gray-300 cursor-pointer px-4 bg-white outline-none focus:ring-2 focus:ring-red-500"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Selector */}

      <div className="mb-6 overflow-x-auto">
        <div className="flex justify-between gap-2 min-w-max">
          {days.map((day, index) => (
            <button
              key={day.date}
              onClick={() => {
                setSelectedDate(index);
                setSelectedSlots([]);

                if (selectedGamingStation) {
                  handleGetSlotsAvailability(
                    selectedGamingStation,
                    selectedStation,
                    day.date
                  );
                }
              }}
              className={`
      min-w-[120px]
      rounded-xl
      border
      px-4
      py-3
      cursor-pointer
      transition-all
      ${selectedDate === index
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "bg-white border-gray-200 hover:border-gray-300"
                }
    `}
            >
              <div className="text-xs font-medium">{day.label}</div>
              <div className="text-base font-semibold">{day.day}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Gaming Stations */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Available Gaming Stations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gamingStations.map((station) => (
            <div
              key={station.id}
              onClick={() => {
                setSelectedGamingStation(station.id);
                setSelectedSlots([]);

                handleGetSlotsAvailability(
                  station.id,
                  selectedStation,
                  days[selectedDate].date
                );
              }}
              className={`
      rounded-xl
      p-4
      cursor-pointer
      border
      transition-all

      ${selectedGamingStation === station.id
                  ? "border-red-500 bg-red-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-red-300 hover:shadow-md"
                }
    `}
            >
              <h3
                className={`font-medium ${selectedGamingStation === station.id
                  ? "text-red-700"
                  : "text-gray-900"
                  }`}
              >
                {station.name}
              </h3>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">

        {/* Slot section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 h-fit">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {slotsAvailability.map((slot) => (
              <button
                key={slot.id}
                disabled={slot.status !== "available"}
                onClick={() => toggleSlot(slot.id)}
                className={`
    h-11
    rounded-xl
    border
    text-sm
    font-medium
    transition-all
    cursor-pointer

    ${isSelected(slot.id)
                    ? "border-red-500 bg-red-50 text-red-700"
                    : slot.status === "available"
                      ? "bg-white border-gray-200 hover:border-gray-400"
                      : slot.status === "booked"
                        ? "bg-green-100 border-green-200 text-gray-500 cursor-not-allowed"
                        : "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                  }
  `}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </div>
        {/* Summary */}

        <div className="lg:sticky lg:top-6 h-fit">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-5">
              <Calendar size={18} />
              <h3 className="font-semibold">Booking Summary</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Station</span>
                <span className="font-medium">
                  {categories.find((x) => x.id === selectedStation)?.name}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Hours</span>
                <span className="font-medium">{totalHours} {totalHours === 1 ? "Hour" : "Hours"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Rate</span>
                <span>Rs. {rate.toLocaleString()}</span>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-semibold">Total</span>

                <span className="text-2xl font-bold text-red-600">
                  Rs. {totalAmount.toLocaleString()}
                </span>
              </div>

              <button className="w-full cursor-pointer h-12 rounded-xl bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white font-medium flex items-center justify-center gap-2">
                Confirm Booking
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}