import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle2, LogIn, LogOut, ChevronLeft, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';

export default function AttendanceScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [fetchingTeam, setFetchingTeam] = useState(true);
    const [teamAttendance, setTeamAttendance] = useState<any[]>([]);
    const [todayRecord, setTodayRecord] = useState<any>(null);

    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    const fetchTeamAttendance = async () => {
        try {
            const res = await api.get('/attendance');
            setTeamAttendance(res.data);
            // Find current user's record for today
            const mine = res.data.find((a: any) => a.userId === user?.id);
            setTodayRecord(mine || null);
        } catch (err) {
            console.error('Error fetching attendance:', err);
        } finally {
            setFetchingTeam(false);
        }
    };

    useEffect(() => {
        fetchTeamAttendance();
    }, []);

    const handleCheckIn = async () => {
        setLoading(true);
        try {
            const now = new Date().toISOString();
            await api.post('/attendance', {
                userId: user?.id,
                date: now,
                status: 'VALIDE',
                checkIn: now,
            });
            Alert.alert('✅ Check-In enregistré', `Arrivée à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
            fetchTeamAttendance();
        } catch (err: any) {
            Alert.alert('Erreur', err.response?.data?.error || 'Impossible d\'enregistrer le check-in');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setLoading(true);
        try {
            const now = new Date().toISOString();
            await api.post('/attendance', {
                userId: user?.id,
                date: now,
                status: todayRecord?.status || 'VALIDE',
                checkOut: now,
            });
            Alert.alert('✅ Check-Out enregistré', `Départ à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
            fetchTeamAttendance();
        } catch (err: any) {
            Alert.alert('Erreur', err.response?.data?.error || 'Impossible d\'enregistrer le check-out');
        } finally {
            setLoading(false);
        }
    };

    const calculateHours = (checkIn: string, checkOut: string) => {
        if (!checkIn || !checkOut) return null;
        const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return `${hours}h${mins.toString().padStart(2, '0')}`;
    };

    const formatTime = (isoString: string | null) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const workedToday = todayRecord ? calculateHours(todayRecord.checkIn, todayRecord.checkOut) : null;

    return (
        <View className="flex-1 bg-slate-900" style={{ paddingTop: Math.max(insets.top, 24) }}>
            <View className="px-5 mb-6 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-slate-800 p-2 rounded-full">
                    <ChevronLeft size={20} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text className="text-white text-2xl font-bold">Pointage</Text>
                    <Text className="text-slate-400 text-sm capitalize">{today}</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                {/* My Status Card */}
                <View className="bg-slate-800 rounded-3xl p-6 border border-slate-700 mb-6 shadow-xl">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-white text-lg font-bold">Ma Présence</Text>
                        <View className={`px-3 py-1 rounded-full border ${todayRecord ? 'bg-primary/10 border-primary/20' : 'bg-slate-700 border-slate-600'}`}>
                            <Text className={`text-[11px] font-bold ${todayRecord ? 'text-primary' : 'text-slate-400'}`}>
                                {todayRecord ? 'POINTÉ' : 'NON POINTÉ'}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between mb-6">
                        <View className="items-center flex-1">
                            <View className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 items-center justify-center mb-2">
                                <LogIn size={24} color="#22C55E" />
                            </View>
                            <Text className="text-slate-400 text-xs mb-1">Arrivée</Text>
                            <Text className="text-white font-bold text-lg">{formatTime(todayRecord?.checkIn)}</Text>
                        </View>

                        <View className="items-center justify-center px-4">
                            {workedToday ? (
                                <View className="bg-primary/10 border border-primary/20 px-3 py-2 rounded-xl">
                                    <Text className="text-primary font-bold text-sm">{workedToday}</Text>
                                    <Text className="text-primary/60 text-[9px] text-center">travaillé</Text>
                                </View>
                            ) : (
                                <View className="w-px h-8 bg-slate-700" />
                            )}
                        </View>

                        <View className="items-center flex-1">
                            <View className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 items-center justify-center mb-2">
                                <LogOut size={24} color="#EF4444" />
                            </View>
                            <Text className="text-slate-400 text-xs mb-1">Départ</Text>
                            <Text className="text-white font-bold text-lg">{formatTime(todayRecord?.checkOut)}</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-3">
                        <Button
                            onPress={handleCheckIn}
                            loading={loading}
                            disabled={!!todayRecord?.checkIn}
                            className={`flex-1 h-14 rounded-2xl ${todayRecord?.checkIn ? 'bg-slate-700' : 'bg-green-500'}`}
                            textClassName={todayRecord?.checkIn ? 'text-slate-500' : 'text-white'}
                        >
                            {todayRecord?.checkIn ? '✓ Arrivée OK' : 'CHECK IN — Matin'}
                        </Button>
                        <Button
                            onPress={handleCheckOut}
                            loading={loading}
                            disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut}
                            className={`flex-1 h-14 rounded-2xl ${!todayRecord?.checkIn || todayRecord?.checkOut ? 'bg-slate-700' : 'bg-red-500'}`}
                            textClassName={!todayRecord?.checkIn || todayRecord?.checkOut ? 'text-slate-500' : 'text-white'}
                        >
                            {todayRecord?.checkOut ? '✓ Départ OK' : 'CHECK OUT — Soir'}
                        </Button>
                    </View>
                </View>

                {/* Team Attendance (for Chefs d'équipe and above) */}
                {(user?.role === 'CHEF_EQUIPE' || user?.role === 'CONDUCTEUR' || user?.role === 'ADMIN') && (
                    <View className="mb-6">
                        <View className="flex-row items-center mb-4">
                            <Users size={18} color="#94A3B8" />
                            <Text className="text-white text-lg font-bold ml-2">Équipe du Jour</Text>
                        </View>
                        {fetchingTeam ? (
                            <ActivityIndicator color="#22C55E" />
                        ) : teamAttendance.length === 0 ? (
                            <Text className="text-slate-500 italic text-center py-4">Aucun pointage enregistré aujourd'hui.</Text>
                        ) : (
                            teamAttendance.map((record: any) => (
                                <View key={record.id} className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 mb-3 flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-white font-semibold">{record.user?.firstName} {record.user?.lastName}</Text>
                                        <Text className="text-slate-500 text-xs">{record.user?.role}</Text>
                                    </View>
                                    <View className="items-end">
                                        <View className="flex-row items-center">
                                            <Text className="text-green-400 text-xs mr-3">↑ {formatTime(record.checkIn)}</Text>
                                            <Text className="text-red-400 text-xs">↓ {formatTime(record.checkOut)}</Text>
                                        </View>
                                        {calculateHours(record.checkIn, record.checkOut) && (
                                            <Text className="text-primary text-xs font-bold mt-1">{calculateHours(record.checkIn, record.checkOut)}</Text>
                                        )}
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}
                <View className="h-20" />
            </ScrollView>
        </View>
    );
}
