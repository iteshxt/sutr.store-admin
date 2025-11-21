import { useEffect, useRef, useState } from 'react';
import { useAuth } from './auth-context';
import { useRouter } from 'next/navigation';

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
const WARNING_TIME = 55 * 60 * 1000; // Show warning at 55 minutes (5 minutes before timeout)

interface SessionWarning {
    show: boolean;
    countdown: number;
}

export function useSessionTimeout() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(0);
    const [warning, setWarning] = useState<SessionWarning>({ show: false, countdown: 0 });

    useEffect(() => {
        if (!user) return;

        const startSession = () => {
            setWarning({ show: false, countdown: 0 });
            lastActivityRef.current = Date.now();

            // Clear existing timers
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);
            if (countdownRef.current) clearTimeout(countdownRef.current);

            // Set warning timeout (at 55 minutes - 5 minutes before logout)
            warningRef.current = setTimeout(() => {
                setWarning({ show: true, countdown: 300 }); // 5 minutes in seconds

                // Start countdown
                let remainingTime = 300; // 5 minutes in seconds
                const countdown = setInterval(() => {
                    remainingTime--;
                    setWarning({ show: true, countdown: remainingTime });
                    if (remainingTime <= 0) {
                        clearInterval(countdown);
                    }
                }, 1000);

                countdownRef.current = countdown as any;
            }, WARNING_TIME);

            // Set logout timeout (at 10 seconds)
            timeoutRef.current = setTimeout(() => {
                handleSessionTimeout();
            }, SESSION_TIMEOUT);
        };

        const handleSessionTimeout = async () => {
            try {
                await signOut();
                router.push('/login');
            } catch (error) {
                // Silent error handling in production
            }
        };

        // Track user activity to reset timer with throttling for mousemove
        const resetTimerOnActivity = (e: Event) => {
            // For mousemove, throttle to only reset every 500ms
            if (e.type === 'mousemove') {
                const now = Date.now();
                if (now - lastActivityRef.current < 500) {
                    return;
                }
                lastActivityRef.current = now;
            }

            startSession();
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];

        events.forEach((event) => {
            window.addEventListener(event, resetTimerOnActivity, true);
        });

        // Start the session timer on mount
        startSession();

        // Cleanup
        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, resetTimerOnActivity, true);
            });
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);
            if (countdownRef.current) clearTimeout(countdownRef.current);
        };
    }, [user, signOut, router]);

    return warning;
}
