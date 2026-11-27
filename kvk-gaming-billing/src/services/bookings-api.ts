import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const BOOKINGS_API_URL = `${API_URL}gaming-m/gaming-bookings/`;

const getToken = () => {
  const cashier = localStorage.getItem("cashier")
    ? JSON.parse(localStorage.getItem("cashier") as string)
    : null;

  return cashier ? cashier.token : null;
};

export type CashierSlip = {
    id: string; customerName: string; phoneNumber: string; amount: number;
    paymentDueUtc: string; slotCount: number; revision: string | null; approved: boolean; smsSent: boolean;
};

const slipUrl = `${BOOKINGS_API_URL}cashier-slips`;
const slipAuth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

export async function reserveCashierSlip(payload: { holdIds: string[]; customerName: string; phoneNumber: string; expectedAmount: number }) {
    return (await axios.post<CashierSlip>(slipUrl, payload, slipAuth())).data;
}

export async function getCashierSlips(signal: AbortSignal) {
    return (await axios.get<CashierSlip[]>(slipUrl, { ...slipAuth(), signal })).data;
}

export async function uploadCashierSlip(id: string, file: File) {
    const body = new FormData();
    body.append("slip", file);
    return (await axios.post<CashierSlip>(`${slipUrl}/${id}/slip`, body, slipAuth())).data;
}

export async function downloadCashierSlip(id: string) {
    return (await axios.get<Blob>(`${slipUrl}/${id}/slip`, { ...slipAuth(), responseType: "blob" })).data;
}

export async function approveCashierSlip(id: string, revision: string) {
    return (await axios.post<CashierSlip>(`${slipUrl}/${id}/approve/${revision}`, null, slipAuth())).data;
}

export const multiHoldBooking = async (bookingData: any) => {
    try {
        const response = await axios.post(`${BOOKINGS_API_URL}multi-hold`, bookingData, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

type ConfirmedGamingSlot = {
    holdId: string;
    bookingNumber: string;
    bookingAmount: number;
    paymentType: number;
    gamingStationId: string;
    gamingSlotId: string;
    bookingDate: string;
};

export async function confirmBooking(bookingData: {
    holdIds: string[];
    paymentIntentId: null;
    customerDetails: { customerName: string; phoneNumber: string; paymentType: number };
}) {
    const { data } = await axios.post<{
        succeeded: boolean;
        message: string;
        additionalData?: { response?: ConfirmedGamingSlot[] };
    }>(`${BOOKINGS_API_URL}confirm-multi`, bookingData, slipAuth());
    if (!data.succeeded) throw new Error(data.message);
    return data.additionalData?.response ?? [];
}

export const WALK_IN_PENDING_PAYMENT = 6;

export async function createWalkIn(booking: { holdIds: string[]; customerName: string; phoneNumber: string }) {
    await axios.post(`${BOOKINGS_API_URL}walk-ins`, booking, {
        headers: { Authorization: `Bearer ${getToken()}` },
    });
}

export async function payWalkIn(walkInId: string, paymentType: 1 | 2) {
    await axios.post(`${BOOKINGS_API_URL}walk-ins/${walkInId}/pay`, { paymentType }, {
        headers: { Authorization: `Bearer ${getToken()}` },
    });
}

export const getGamingBookingsList = async (params: {
    fromDate?: string;
    toDate?: string;
    status?: number;
    includePendingWalkIns?: boolean;
    gamingCategoryId?: string;
    gamingStationId?: string;
    searchTerm?: string;
    pageNumber?: number;
    pageSize?: number;
}, signal?: AbortSignal) => {
    try {
        const query = new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    acc[key] = String(value);
                }
                return acc;
            }, {} as Record<string, string>),
        ).toString();

        const response = await axios.get(`${BOOKINGS_API_URL}?${query}`, {
            signal,
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}
