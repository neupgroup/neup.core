"use client";

import {useContext} from 'react';
import {Geolocation} from '@/core/providers/geolocation';

type ActivityStatus = "Success" | "Failed" | "Pending" | "Alert";
type ActivityLogger = (
    memberId: string,
    action: string,
    status: ActivityStatus,
    ipAddress?: string,
    actorAccountId?: string,
    location?: string,
) => unknown;

let activityLogger: ActivityLogger | null = null;

export function setActivityLogger(logger: ActivityLogger | null) {
    activityLogger = logger;
}

// Client-side hook to wrap logActivity and inject geolocation
export function useLogActivity() {
    const geo = useContext(Geolocation);

    return (
        memberId: string,
        action: string,
        status: "Success" | "Failed" | "Pending" | "Alert",
        ipAddress?: string,
        actorAccountId?: string
    ) => {
        const locationString = geo?.latitude && geo?.longitude
            ? `${geo.latitude},${geo.longitude}`
            : undefined;

        return activityLogger?.(memberId, action, status, ipAddress, actorAccountId, locationString);
    };
}
