import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, ChangeEvent, FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Edit3,
  Eye,
  Gamepad2,
  Image as ImageIcon,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { createGame, getGames, updateGame } from "@/services/game-api";


type Game = {
  id: number;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
};

type GameForm = {
  id?: number;
  name: string;
  description: string;
  isActive: boolean;
};

type PageAlert = {
  type: "success" | "error";
  message: string;
} | null;

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return (
      value.toLowerCase() === "true" ||
      value === "1" ||
      value.toLowerCase() === "active"
    );
  }

  return false;
};

const normalizeGame = (item: any): Game => {
  return {
    id: Number(item?.id ?? item?.Id ?? 0),
    name: String(item?.name ?? item?.Name ?? ""),
    description: String(item?.description ?? item?.Description ?? ""),
    image: String(
      item?.image ??
        item?.Image ??
        item?.imageUrl ??
        item?.ImageUrl ??
        ""
    ),
    isActive: normalizeBoolean(item?.isActive ?? item?.IsActive),
  };
};

const extractGames = (response: any): Game[] => {
  const possibleData =
    response?.additionalData?.response ??
    response?.additionalData?.data ??
    response?.response ??
    response?.data ??
    response;

  if (Array.isArray(possibleData)) {
    return possibleData.map(normalizeGame);
  }

  if (Array.isArray(possibleData?.items)) {
    return possibleData.items.map(normalizeGame);
  }

  if (Array.isArray(possibleData?.data)) {
    return possibleData.data.map(normalizeGame);
  }

  return [];
};

const getImageSource = (image?: string): string => {
  if (!image) return "";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  // Base64 image returned by API
  if (/^[A-Za-z0-9+/=]+$/.test(image)) {
    return `data:image/png;base64,${image}`;
  }

  return image;
};

const formatDescription = (description: string) => {
  if (!description) return "No description available";

  return description.length > 110
    ? `${description.substring(0, 110)}...`
    : description;
};

const SummaryCard = ({
  title,
  value,
  description,
  icon,
  iconClassName,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

const LoadingOverlay = () => {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]">
      <div className="flex min-w-[180px] flex-col items-center rounded-2xl border border-white/60 bg-white px-7 py-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <Loader2 className="animate-spin text-red-700" size={24} />
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-800">
          Please wait...
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Processing your request
        </p>
      </div>
    </div>,
    document.body
  );
};

const AlertMessage = ({
  alert,
  onClose,
}: {
  alert: PageAlert;
  onClose: () => void;
}) => {
  if (!alert) return null;

  const isSuccess = alert.type === "success";

  return createPortal(
    <div className="fixed right-4 top-4 z-[9998] w-[calc(100%-2rem)] max-w-sm">
      <div
        className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl ${
          isSuccess ? "border-emerald-200" : "border-red-200"
        }`}
      >
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isSuccess
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 size={19} />
          ) : (
            <AlertCircle size={19} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-semibold ${
              isSuccess ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {isSuccess ? "Success" : "Error"}
          </p>

          <p className="mt-1 text-sm leading-5 text-slate-600">
            {alert.message}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={16} />
        </button>
      </div>
    </div>,
    document.body
  );
};

const EmptyState = ({
  searchTerm,
  onClear,
  onAdd,
}: {
  searchTerm: string;
  onClear: () => void;
  onAdd: () => void;
}) => {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-700">
        <Gamepad2 size={30} />
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-900">
        {searchTerm ? "No games found" : "No games available"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {searchTerm
          ? "Try adjusting your search term or clear the current search."
          : "Start building your gaming centre by adding your first game."}
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {searchTerm ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Clear Search
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
          >
            <Plus size={17} />
            Add Game
          </button>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />

      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

const GameModal = ({
  open,
  mode,
  form,
  setForm,
  selectedImage,
  imagePreview,
  isDragging,
  formErrors,
  isSubmitting,
  onClose,
  onSubmit,
  onImageChange,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onRemoveImage,
}: {
  open: boolean;
  mode: "create" | "edit" | "view";
  form: GameForm;
  setForm: React.Dispatch<React.SetStateAction<GameForm>>;
  selectedImage: File | null;
  imagePreview: string;
  isDragging: boolean;
  formErrors: Record<string, string>;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDragEnter: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onRemoveImage: () => void;
}) => {
  if (!open) return null;

  const isView = mode === "view";
  const isEdit = mode === "edit";

  const title = isView
    ? "Game Details"
    : isEdit
      ? "Edit Game"
      : "Add Game";

  const subtitle = isView
    ? "View the selected gaming centre game."
    : isEdit
      ? "Update game details and availability."
      : "Add a new game to your gaming centre.";

  return createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5">
      <div className="relative my-auto flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <Gamepad2 size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                {title}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={onSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-[260px_1fr]">
            {/* Image */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Game Image
              </label>

              {isView ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={form.name}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square flex-col items-center justify-center text-slate-400">
                      <ImageIcon size={32} />
                      <span className="mt-2 text-xs">
                        No image available
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                    isDragging
                      ? "border-red-500 bg-red-50"
                      : formErrors.image
                        ? "border-red-300 bg-red-50/30"
                        : "border-slate-200 bg-slate-50/70 hover:border-red-300 hover:bg-red-50/30"
                  }`}
                >
                  {imagePreview ? (
                    <div className="group relative">
                      <img
                        src={imagePreview}
                        alt="Game preview"
                        className="aspect-square w-full object-cover"
                      />

                      <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-slate-950/70 via-transparent to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                        <span className="truncate pr-2 text-xs font-medium text-white">
                          {selectedImage?.name || "Current image"}
                        </span>

                        <button
                          type="button"
                          onClick={onRemoveImage}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/90 text-red-600 shadow-sm transition hover:bg-white"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center p-5 text-center">
                      <input
                        type="file"
                        accept={ALLOWED_IMAGE_TYPES.join(",")}
                        onChange={onImageChange}
                        className="hidden"
                      />

                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          isDragging
                            ? "bg-red-100 text-red-700"
                            : "bg-white text-slate-500 shadow-sm"
                        }`}
                      >
                        <Upload size={22} />
                      </div>

                      <p className="mt-4 text-sm font-semibold text-slate-700">
                        Drop image here
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        or click to browse
                      </p>

                      <p className="mt-3 text-[11px] text-slate-400">
                        PNG, JPG or WEBP · Max 5MB
                      </p>
                    </label>
                  )}
                </div>
              )}

              {formErrors.image && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle size={13} />
                  {formErrors.image}
                </p>
              )}
            </div>

            {/* Form */}
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Game Name
                  {!isView && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>

                <input
                  type="text"
                  value={form.name}
                  disabled={isView}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter game name"
                  className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 ${
                    formErrors.name
                      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                      : "border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  } ${
                    isView
                      ? "cursor-default bg-slate-50 text-slate-600"
                      : ""
                  }`}
                />

                {formErrors.name && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Description
                </label>

                <textarea
                  value={form.description}
                  disabled={isView}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe the game..."
                  rows={5}
                  className={`w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 ${
                    isView
                      ? "cursor-default bg-slate-50 text-slate-600"
                      : ""
                  }`}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Availability
                </label>

                <button
                  type="button"
                  disabled={isView}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: !prev.isActive,
                    }))
                  }
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    form.isActive
                      ? "border-emerald-200 bg-emerald-50/60"
                      : "border-slate-200 bg-slate-50"
                  } ${
                    isView
                      ? "cursor-default"
                      : "hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        form.isActive
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      <CircleDot size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {form.isActive ? "Active" : "Inactive"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {form.isActive
                          ? "This game is available for bookings."
                          : "This game is currently unavailable."}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`relative h-6 w-11 rounded-full transition ${
                      form.isActive
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                        form.isActive ? "left-6" : "left-1"
                      }`}
                    />
                  </div>
                </button>
              </div>

              {isView && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Status
                      </p>

                      <div className="mt-2">
                        <StatusBadge isActive={form.isActive} />
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Game ID
                      </p>

                      <p className="mt-2 text-sm font-bold text-slate-700">
                        #{form.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border cursor-pointer border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {isView ? "Close" : "Cancel"}
            </button>

            {!isView && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 items-center cursor-pointer justify-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    {isEdit ? "Update Game" : "Create Game"}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

const GamePage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<
    "create" | "edit" | "view"
  >("create");

  const [selectedGame, setSelectedGame] = useState<Game | null>(
    null
  );

  const [form, setForm] = useState<GameForm>({
    name: "",
    description: "",
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<
    Record<string, string>
  >({});

  const [selectedImage, setSelectedImage] = useState<File | null>(
    null
  );

  const [imagePreview, setImagePreview] = useState("");

  const [isDragging, setIsDragging] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const [pageAlert, setPageAlert] = useState<PageAlert>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadGames = async () => {
    setIsLoading(true);

    try {
      const response = await getGames();
      const normalizedGames = extractGames(response);

      setGames(normalizedGames);
    } catch (error) {
      console.error("Failed to load games:", error);

      setPageAlert({
        type: "error",
        message: "Unable to load games. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (!pageAlert) return;

    const timeout = window.setTimeout(() => {
      setPageAlert(null);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [pageAlert]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);

    document.addEventListener("click", closeMenu);

    return () => {
      document.removeEventListener("click", closeMenu);
    };
  }, []);

  const filteredGames = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return games;

    return games.filter((game) => {
      return (
        game.name.toLowerCase().includes(search) ||
        game.description.toLowerCase().includes(search)
      );
    });
  }, [games, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredGames.length / itemsPerPage)
  );

  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;

    return filteredGames.slice(start, start + itemsPerPage);
  }, [filteredGames, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalGames = games.length;

  const activeGames = games.filter((game) => game.isActive).length;

  const inactiveGames = games.filter(
    (game) => !game.isActive
  ).length;

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedGame(null);

    setForm({
      name: "",
      description: "",
      isActive: true,
    });

    setFormErrors({});
    setSelectedImage(null);
    setImagePreview("");

    setIsModalOpen(true);
  };

  const openEditModal = (game: Game) => {
    setModalMode("edit");
    setSelectedGame(game);

    setForm({
      id: game.id,
      name: game.name,
      description: game.description,
      isActive: game.isActive,
    });

    setFormErrors({});
    setSelectedImage(null);
    setImagePreview(getImageSource(game.image));

    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const openViewModal = (game: Game) => {
    setModalMode("view");
    setSelectedGame(game);

    setForm({
      id: game.id,
      name: game.name,
      description: game.description,
      isActive: game.isActive,
    });

    setFormErrors({});
    setSelectedImage(null);
    setImagePreview(getImageSource(game.image));

    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const closeModal = () => {
    if (isSubmitting) return;

    setIsModalOpen(false);
    setSelectedGame(null);
    setSelectedImage(null);
    setImagePreview("");
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) {
      errors.name = "Game name is required.";
    } else if (form.name.trim().length < 2) {
      errors.name = "Game name must contain at least 2 characters.";
    }

    if (
      modalMode === "create" &&
      !selectedImage &&
      !imagePreview
    ) {
      errors.image = "Please upload a game image.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const processImageFile = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormErrors({
        image: "Only JPG, PNG and WEBP images are allowed.",
      });

      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setFormErrors({
        image: "Image size must be less than 5MB.",
      });

      return;
    }

    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    setSelectedImage(file);

    const objectUrl = URL.createObjectURL(file);

    setImagePreview((oldPreview) => {
      if (oldPreview.startsWith("blob:")) {
        URL.revokeObjectURL(oldPreview);
      }

      return objectUrl;
    });
  };

  const handleImageChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      processImageFile(file);
    }

    e.target.value = "";
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    e.dataTransfer.dropEffect = "copy";

    setIsDragging(true);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      processImageFile(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);

    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      if (modalMode === "edit" && form.id) {
        formData.append("Id", String(form.id));
      }

      formData.append("Name", form.name.trim());
      formData.append("Description", form.description.trim());
      formData.append("IsActive", String(form.isActive));

      if (selectedImage) {
        formData.append("Image", selectedImage);
      }

      if (modalMode === "create") {
        await createGame(formData);

        setPageAlert({
          type: "success",
          message: "Game created successfully.",
        });
      } else {
        await updateGame(formData);

        setPageAlert({
          type: "success",
          message: "Game updated successfully.",
        });
      }

      closeModal();

      await loadGames();
    } catch (error) {
      console.error("Game save failed:", error);

      setPageAlert({
        type: "error",
        message:
          "Unable to save the game. Please check the details and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageStart =
    filteredGames.length === 0
      ? 0
      : (currentPage - 1) * itemsPerPage + 1;

  const pageEnd = Math.min(
    currentPage * itemsPerPage,
    filteredGames.length
  );

  return (
    <main className="min-h-screen bg-slate-50/60">
      <AlertMessage
        alert={pageAlert}
        onClose={() => setPageAlert(null)}
      />

      {isLoading && <LoadingOverlay />}

      <GameModal
        open={isModalOpen}
        mode={modalMode}
        form={form}
        setForm={setForm}
        selectedImage={selectedImage}
        imagePreview={imagePreview}
        isDragging={isDragging}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onImageChange={handleImageChange}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onRemoveImage={removeImage}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-700 text-white shadow-sm shadow-red-700/20">
              <Gamepad2 size={22} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Games
                </h1>

                <span className="hidden rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 sm:inline-flex">
                  Gaming Centre
                </span>
              </div>

              <p className="mt-0.5 text-sm text-slate-500">
                Manage gaming experiences, availability and game
                information.
              </p>
            </div>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => window.location.reload()}
              disabled={isLoading}
              className="inline-flex cursor-pointer h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              <RefreshCw
                size={17}
                className={isLoading ? "animate-spin" : ""}
              />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex cursor-pointer h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white shadow-sm shadow-red-700/20 transition hover:bg-red-800 sm:flex-none"
            >
              <Plus size={18} />
              <span>Add Game</span>
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Games"
            value={totalGames}
            description="Games configured in the system"
            icon={<Gamepad2 size={20} />}
            iconClassName="bg-red-50 text-red-700"
          />

          <SummaryCard
            title="Active Games"
            value={activeGames}
            description="Currently available games"
            icon={<Zap size={20} />}
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Inactive Games"
            value={inactiveGames}
            description="Currently unavailable games"
            icon={<CircleDot size={20} />}
            iconClassName="bg-slate-100 text-slate-500"
          />
        </div>

        {/* Main content */}
        <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search games..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <p className="text-xs font-medium text-slate-400">
                {filteredGames.length}{" "}
                {filteredGames.length === 1 ? "game" : "games"}
              </p>

              {searchTerm && (
                <span className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700">
                  Searching
                </span>
              )}
            </div>
          </div>

          {/* Empty */}
          {!isLoading && filteredGames.length === 0 ? (
            <EmptyState
              searchTerm={searchTerm}
              onClear={() => setSearchTerm("")}
              onAdd={openCreateModal}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Game
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Description
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="w-16 px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedGames.map((game) => (
                      <tr
                        key={game.id}
                        className="group transition hover:bg-red-50/20"
                      >
                        {/* Game */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                              {game.image ? (
                                <img
                                  src={getImageSource(game.image)}
                                  alt={game.name}
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    e.currentTarget.style.display =
                                      "none";
                                  }}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-400">
                                  <Gamepad2 size={20} />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {game.name || "Unnamed Game"}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                Game #{game.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="max-w-[420px] px-5 py-4">
                          <p className="text-sm leading-6 text-slate-600">
                            {formatDescription(game.description)}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge isActive={game.isActive} />
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right">
                          <div
                            className="relative inline-block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId((prev) =>
                                  prev === game.id
                                    ? null
                                    : game.id
                                )
                              }
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-700"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {openMenuId === game.id && (
                              <div className="absolute right-0 top-10 z-50 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openViewModal(game)
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <Eye
                                    size={16}
                                    className="text-slate-400"
                                  />
                                  View
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(game)
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-700"
                                >
                                  <Edit3 size={16} />
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {paginatedGames.map((game) => (
                  <div
                    key={game.id}
                    className="p-4 transition hover:bg-slate-50/70"
                  >
                    <div className="flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        {game.image ? (
                          <img
                            src={getImageSource(game.image)}
                            alt={game.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <Gamepad2 size={23} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-slate-900">
                              {game.name || "Unnamed Game"}
                            </h3>

                            <p className="mt-0.5 text-xs text-slate-400">
                              Game #{game.id}
                            </p>
                          </div>

                          <StatusBadge isActive={game.isActive} />
                        </div>

                        <p className="mt-3 text-sm leading-5 text-slate-600">
                          {formatDescription(game.description)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openViewModal(game)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <Eye size={16} />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(game)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <Edit3 size={16} />
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <p className="text-xs font-medium text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {pageStart}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-slate-700">
                      {pageEnd}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">
                      {filteredGames.length}
                    </span>
                  </p>

                  <div className="hidden h-4 w-px bg-slate-200 sm:block" />

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      Rows
                    </span>

                    <select
                      value={itemsPerPage}
                      onChange={(e) =>
                        setItemsPerPage(Number(e.target.value))
                      }
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    >
                      {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>

                  <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-red-700 px-3 text-xs font-bold text-white">
                    {currentPage}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(totalPages, prev + 1)
                      )
                    }
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default GamePage;