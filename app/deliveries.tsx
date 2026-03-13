import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import api from '../lib/api';
import { Truck, Calendar, Box, ShieldCheck, ChevronLeft, Package, Clock, MapPin } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard } from '../components/ui/PremiumCard';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function DeliveriesScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const fetchDeliveries = async () => {
        try {
            const response = await api.get('/deliveries');
            setDeliveries(response.data);
        } catch (error) {
            console.error("Error fetching deliveries:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchDeliveries();
        setRefreshing(false);
    }, []);

    const DeliveryCard = ({ delivery, index }: { delivery: any, index: number }) => (
        <PremiumCard index={index} glass={true} style={{ padding: 20, marginBottom: 16 }}>
            <View className="flex-row justify-between items-start mb-5">
                <View className="flex-row items-center flex-1 mr-4">
                    <View className="w-12 h-12 bg-indigo-500/10 rounded-2xl items-center justify-center mr-4 border border-indigo-500/20">
                        <Package color="#818CF8" size={24} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-black text-xl tracking-tight mb-1">{delivery.item}</Text>
                        <View className="flex-row items-center">
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{delivery.supplier || 'Logistique Interne'}</Text>
                        </View>
                    </View>
                </View>
                <View className="bg-slate-950/50 px-3 py-1.5 rounded-xl border border-white/5">
                    <Text className="text-primary text-[10px] font-black tracking-widest uppercase">
                        {delivery.quantity ? `${delivery.quantity}` : 'Unit.'}
                    </Text>
                </View>
            </View>
            
            <View className="flex-row items-center mb-5 bg-slate-900/40 self-start px-3 py-2 rounded-xl border border-white/5">
                <Calendar size={14} color="#C8842A" />
                <Text className="text-slate-300 text-[11px] font-black uppercase tracking-wider ml-2">
                    {new Date(delivery.plannedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
            </View>

            {delivery.notes && (
                <View className="bg-slate-950/30 p-4 rounded-2xl border border-white/5 mb-5">
                    <Text className="text-slate-500 text-xs font-medium leading-5">"{delivery.notes}"</Text>
                </View>
            )}

            <View className="pt-5 border-t border-white/5 flex-row justify-between items-center">
                <View className="flex-row items-center bg-slate-950/40 px-3 py-1.5 rounded-lg border border-white/5">
                    <Box size={12} color="#C8842A" />
                    <Text className="text-primary text-[9px] font-black uppercase tracking-[2px] ml-2">
                        {delivery.project.name}
                    </Text>
                </View>
                {user?.role !== 'CHEF_EQUIPE' && (
                    <TouchableOpacity className="bg-emerald-500/10 border border-emerald-500/30 px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10">
                        <Text className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Réceptionner</Text>
                    </TouchableOpacity>
                )}
            </View>
        </PremiumCard>
    );

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#1e293b', '#0f172a', '#020617']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View className="px-5 mb-10 flex-row items-center" style={{ paddingTop: Math.max(insets.top, 24) }}>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="w-12 h-12 bg-slate-900 rounded-2xl items-center justify-center border border-white/5 mr-5"
                >
                    <ChevronLeft size={24} color="#C8842A" />
                </TouchableOpacity>
                <View>
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[4px] mb-1">Chaîne Logistique</Text>
                    <Text className="text-white text-3xl font-black tracking-tight">Livraisons</Text>
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#C8842A" size="large" />
                </View>
            ) : (
                <ScrollView 
                    className="flex-1 px-5"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            tintColor="#C8842A" 
                            colors={['#C8842A']} 
                        />
                    }
                >
                    {deliveries.length > 0 ? (
                        deliveries.map((d, idx) => (
                            <DeliveryCard key={d.id} delivery={d} index={idx} />
                        ))
                    ) : (
                        <Animated.View entering={FadeIn.delay(300)} className="items-center justify-center py-24">
                            <View className="w-24 h-24 bg-slate-900 rounded-[35px] items-center justify-center mb-8 border border-white/5">
                                <Truck size={48} color="#1e293b" strokeWidth={1.5} />
                            </View>
                            <Text className="text-white font-black text-xl mb-3 uppercase tracking-tighter">Entrepôt Vide</Text>
                            <Text className="text-slate-500 text-center px-10 text-sm font-medium leading-5">
                                Toutes les livraisons sont à jour. Aucun mouvement prévu pour le moment.
                            </Text>
                        </Animated.View>
                    )}
                </ScrollView>
            )}
            
            {["ADMIN", "CONDUCTEUR"].includes(user?.role || "") && (
                <TouchableOpacity 
                    className="absolute bottom-10 right-6 bg-primary w-16 h-16 rounded-[24px] items-center justify-center shadow-2xl shadow-primary/30"
                    activeOpacity={0.8}
                >
                    <Text className="text-slate-950 text-3xl font-black">+</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({});
