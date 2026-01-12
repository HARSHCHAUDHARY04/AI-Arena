
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardGraphProps {
    eventId: string;
}

export function LeaderboardGraph({ eventId }: LeaderboardGraphProps) {
    const [data, setData] = useState<any[]>([]);
    const [topTeams, setTopTeams] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [eventId]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:4000/api/score-history?event_id=${eventId}`);
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
                setTopTeams(json.topTeams);
            }
        } catch (err) {
            console.error('Error fetching graph data', err);
        } finally {
            setLoading(false);
        }
    };

    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F"];

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }

    if (data.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">Not enough data for graph.</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
        >
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-display font-semibold text-lg">Live Competition Progress</h3>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        {topTeams.map((team, index) => (
                            <Line
                                key={team}
                                type="monotone"
                                dataKey={team}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
