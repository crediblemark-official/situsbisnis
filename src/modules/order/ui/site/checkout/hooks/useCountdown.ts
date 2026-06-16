import { useState, useEffect } from "react";

/**
 * Hook kustom untuk menghitung mundur durasi pembayaran
 */
export function useCountdown(createdAt: string, expiryMinutes = 1440) {
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        const expiryTime = new Date(createdAt).getTime() + expiryMinutes * 60 * 1000;
        const update = () => setSecondsLeft(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [createdAt, expiryMinutes]);

    return {
        h: Math.floor(secondsLeft / 3600),
        m: Math.floor((secondsLeft % 3600) / 60),
        s: secondsLeft % 60,
        expired: secondsLeft === 0
    };
}
