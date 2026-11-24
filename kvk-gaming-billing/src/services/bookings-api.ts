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

export const confirmBooking = async (bookingData: any) => {
    try {
        const response = await axios.post(`${BOOKINGS_API_URL}confirm-multi`, bookingData, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
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
}) => {
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
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}
