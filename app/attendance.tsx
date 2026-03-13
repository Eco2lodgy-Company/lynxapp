import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle2, LogIn, LogOut, ChevronLeft, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard } from '../components/ui/PremiumCard';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

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
            Alert.alert('✅ Arrivée enregistrée', `Bienvenue ! Il est ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
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
            Alert.alert('✅ Départ enregistré', `Bonne fin de journée ! Départ à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
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
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#1e293b', '#0f172a', '#020617']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            <View 
                className="px-5 mb-8 flex-row items-center" 
                style={{ paddingTop: Math.max(insets.top, 24) }}
            >
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="mr-6 bg-slate-900 w-12 h-12 rounded-2xl items-center justify-center border border-white/10"
                >
                    <ChevronLeft size={24} color="#C8842A" strokeWidth={3} />
                </TouchableOpacity>
                <View>
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[4px] mb-1">Journal de Bord</Text>
                    <Text className="text-white text-3xl font-black tracking-tight">Pointage</Text>
                </View>
            </View>

            <ScrollView 
                className="flex-1 px-5" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <Animated.View entering={FadeInDown.duration(600)} className="mb-10 items-center">
                    <Text className="text-slate-400 font-black text-xs uppercase tracking-[3px] opacity-60">{today}</Text>
                </Animated.View>

                {/* My Status Card */}
                <PremiumCard index={1} glass={true} style={{ padding: 24, marginBottom: 40 }}>
                    <View className="flex-row justify-between items-center mb-10">
                        <Text className="text-white text-xl font-black tracking-tight">Ma Présence</Text>
                        <View className={`px-4 py-1.5 rounded-xl border-2 ${todayRecord ? 'border-primary/40 bg-primary/5' : 'border-slate-800 bg-slate-900/50'}`}>
                            <Text className={`text-[10px] font-black tracking-widest uppercase ${todayRecord ? 'text-primary' : 'text-slate-600'}`}>
                                {todayRecord ? 'ACTIF' : 'ATTENTE'}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between items-center mb-12">
                        <View className="items-center flex-1">
                            <View className="w-20 h-20 rounded-3xl bg-green-500/10 border-2 border-green-500/20 items-center justify-center mb-4">
                                <LogIn size={32} color="#10B981" strokeWidth={2.5} />
                            </View>
                            <Text className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Entrée</Text>
                            <Text className="text-white font-black text-2xl">{formatTime(todayRecord?.checkIn)}</Text>
                        </View>

                        <View className="items-center justify-center px-6">
                            {workedToday ? (
                                <View className="bg-primary/20 border-2 border-primary/40 px-4 py-2.5 rounded-2xl">
                                    <Text className="text-primary font-black text-lg tracking-tighter">{workedToday}</Text>
                                    <View className="w-full h-px bg-primary/30 my-1" />
                                    <Text className="text-primary/60 text-[8px] font-bold text-center uppercase">Total</Text>
                                </View>
                            ) : (
                                <View className="w-10 h-0.5 bg-slate-800 rounded-full" />
                            )}
                        </View>

                        <View className="items-center flex-1">
                            <View className="w-20 h-20 rounded-3xl bg-red-500/10 border-2 border-red-500/20 items-center justify-center mb-4">
                                <LogOut size={32} color="#F43F5E" strokeWidth={2.5} />
                            </View>
                            <Text className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Sortie</Text>
                            <Text className="text-white font-black text-2xl">{formatTime(todayRecord?.checkOut)}</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-4">
                        <Button
                            onPress={handleCheckIn}
                            loading={loading}
                            disabled={!!todayRecord?.checkIn}
                            className={`flex-1 h-16 rounded-2xl shadow-none ${todayRecord?.checkIn ? 'bg-slate-900 border border-white/5' : ''}`}
                        >
                            {todayRecord?.checkIn ? 'Pointé' : 'Arrivée'}
                        </Button>
                        <Button
                            onPress={handleCheckOut}
                            loading={loading}
                            variant={todayRecord?.checkIn && !todayRecord?.checkOut ? 'danger' : 'secondary'}
                            disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut}
                            className="flex-1 h-16 rounded-2xl border-0"
                            style={(!todayRecord?.checkIn || todayRecord?.checkOut) ? { backgroundColor: 'rgba(30, 41, 59, 0.4)', opacity: 0.4 } : {}}
                        >
                            {todayRecord?.checkOut ? 'Pointé' : 'Départ'}
                        </Button>
                    </View>
                </PremiumCard>

                {/* Team Attendance (for Chefs d'équipe and above) */}
                {(user?.role === 'CHEF_EQUIPE' || user?.role === 'CONDUCTEUR' || user?.role === 'ADMIN') && (
                    <View className="mt-4">
                        <View className="flex-row items-center mb-8 px-1">
                            <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center mr-3">
                                <Users size={16} color="#C8842A" strokeWidth={2.5} />
                            </View>
                            <Text className="text-white text-xl font-black tracking-tight">Équipe du Jour</Text>
                        </View>
                        
                        {fetchingTeam ? (
                            <ActivityIndicator color="#C8842A" size="large" />
                        ) : teamAttendance.length === 0 ? (
                            <PremiumCard index={0} style={{ padding: 40, alignItems: 'center' }}>
                                <Users size={48} color="#1e293b" strokeWidth={1} />
                                <Text className="text-slate-500 italic mt-4 text-center">Aucun membre n'a pointé pour le moment.</Text>
                            </PremiumCard>
                        ) : (
                            teamAttendance.map((record: any, idx: number) => (
                                <PremiumCard key={record.id} index={idx} glass={true} style={{ padding: 16, marginBottom: 12 }}>
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-12 h-12 rounded-2xl bg-slate-900 items-center justify-center mr-4 border border-white/5">
                                                <Text className="text-primary font-black text-lg">{record.user?.firstName?.[0]}</Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-white font-bold text-base tracking-tight" numberOfLines={1}>
                                                    {record.user?.firstName} {record.user?.lastName}
                                                </Text>
                                                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-wider mt-0.5">{record.user?.role}</Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <View className="flex-row items-center bg-slate-950/50 px-3 py-2 rounded-xl border border-white/5">
                                                <Text className="text-green-500 font-black text-xs">↑ {formatTime(record.checkIn)}</Text>
                                                <View className="w-px h-3 bg-slate-800 mx-2" />
                                                <Text className="text-red-500 font-black text-xs">↓ {formatTime(record.checkOut)}</Text>
                                            </View>
                                            {calculateHours(record.checkIn, record.checkOut) && (
                                                <View className="bg-primary/5 px-2 py-0.5 rounded-lg self-end mt-2">
                                                    <Text className="text-primary text-[9px] font-black uppercase tracking-widest">{calculateHours(record.checkIn, record.checkOut)}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </PremiumCard>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({});
