
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Bell, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

export function AnnouncementListener() {
    const { toast } = useToast();
    const lastIdRef = useRef<string | null>(null);

    useEffect(() => {
        const poll = setInterval(checkAnnouncements, 5000); // Poll every 5s for faster testing
        checkAnnouncements(); // Check on mount
        return () => clearInterval(poll);
    }, []);

    const checkAnnouncements = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/announcements');
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    const newest = data[0];

                    // Check if we should notify
                    let shouldNotify = false;

                    if (!lastIdRef.current) {
                        // First load: checks if the announcement is very recent (e.g. within last 60 seconds)
                        // If so, show it. Otherwise, assume it's old and user already saw it or doesn't need to.
                        const createdAt = new Date(newest.created_at).getTime();
                        const now = Date.now();
                        if (now - createdAt < 60000) {
                            shouldNotify = true;
                        }
                    } else if (lastIdRef.current !== newest._id) {
                        // New ID encountered since last poll
                        shouldNotify = true;
                    }

                    if (shouldNotify) {
                        showToast(newest);
                    }

                    lastIdRef.current = newest._id;
                }
            }
        } catch (err) {
            console.error('Error polling announcements', err);
        }
    };

    const showToast = (announcement: any) => {
        let icon = <Info className="h-5 w-5 text-blue-500" />;
        let title = "Announcement";

        switch (announcement.type) {
            case 'warning':
                icon = <AlertTriangle className="h-5 w-5 text-yellow-500" />;
                title = "Attention";
                break;
            case 'success':
                icon = <CheckCircle className="h-5 w-5 text-green-500" />;
                title = "Update";
                break;
            case 'destructive':
                icon = <AlertCircle className="h-5 w-5 text-red-500" />;
                title = "Urgent";
                break;
        }

        toast({
            title: title,
            description: announcement.message,
            // We can use custom action logic or just standard toast styles
            duration: 10000,
        });
    };

    return null; // Invisible component
}
