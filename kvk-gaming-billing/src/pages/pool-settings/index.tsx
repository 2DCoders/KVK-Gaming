import { useState } from "react";

export default function PoolSettings() {
  const [Pools, setPools] = useState<any[]>([]);
  const [selectedPool, setSelectedPool] = useState<any>(null);

  const [name, setName] = useState("");
  const [status, setStatus] = useState(true);

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("22:00");
  const [duration, setDuration] = useState(60);
  const [gap, setGap] = useState(0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Pool Settings</h1>
      </div>

      {/* Pool Configuration */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-6">Pool Configuration</h2>

          <div className="space-y-5">
            <div>
              <label className="text-sm text-gray-600 block mb-2">
                Pool Name
              </label>

              <input
                type="text"
                value={name}
                disabled={selectedPool}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-200 px-3"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-2">
                Price
              </label>

              <input
                type="text"
                value={name}
                disabled={selectedPool}
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
              {selectedPool ? (
                <button
                  className="
                h-11 px-5 rounded-xl
                cursor-pointer
                bg-gradient-to-r
                from-red-500
                via-red-600
                to-red-700
                text-white
              "
                >
                  Update Status
                </button>
              ) : (
                <button
                  className="
                h-11 px-5 rounded-xl
                cursor-pointer
                bg-gradient-to-r
                from-red-500
                via-red-600
                to-red-700
                text-white
              "
                >
                  Create Pool
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pool List */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Pool List</h2>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-2">
            {Pools.map((Pool) => (
              <button
                key={Pool.id}
                onClick={() => {
                  setSelectedPool(Pool);
                  setName(Pool.name);
                  setStatus(Pool.status === 1);
                }}
                className={`
              w-full p-3 rounded-xl border
              text-left transition-all
              hover:bg-gray-50
              ${
                selectedPool?.id === Pool.id
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200"
              }
            `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{Pool.name}</span>

                  <span
                    className={`
                  px-2 py-1 rounded-full text-xs
                  ${
                    Pool.status === 1
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }
                `}
                  >
                    {Pool.status === 1 ? "Active" : "Inactive"}
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
          <h2 className="font-semibold">Pool Slot Configuration</h2>
        </div>

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
          <button
            className="
          h-11 px-5 rounded-xl
          bg-gradient-to-r
          from-red-500
          via-red-600
          to-red-700
          text-white
        "
          >
            Create Slot
          </button>
        </div>
      </div>
    </div>
  );
}
