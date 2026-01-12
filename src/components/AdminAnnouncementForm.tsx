
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';

export function AdminAnnouncementForm() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [sending, setSending] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message) return;
        setSending(true);

        try {
            const res = await fetch('http://localhost:4000/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, type, created_by: user?.id })
            });

            if (res.ok) {
                toast({
                    title: 'Announcement Sent',
                    description: 'All participants will receive this notification.',
                });
                setMessage('');
                setType('info');
            } else {
                throw new Error('Failed to send');
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Could not send announcement',
                variant: 'destructive',
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
        >
            <div className="flex items-center gap-2 mb-4">
                <Megaphone className="h-5 w-5 text-accent" />
                <h3 className="font-display font-semibold text-lg">Broadcast Announcement</h3>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                        placeholder="Attention all teams: Submissions close in 10 minutes!"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        required
                    />
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                        <Label>Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="info">Info (Blue)</SelectItem>
                                <SelectItem value="warning">Warning (Yellow)</SelectItem>
                                <SelectItem value="success">Success (Green)</SelectItem>
                                <SelectItem value="destructive">Urgent (Red)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="pt-8">
                        <Button type="submit" disabled={sending} className="w-full">
                            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Broadcast
                        </Button>
                    </div>
                </div>
            </form>
        </motion.div>
    );
}
