import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../lib/api';
import { Truck, Calendar, Box, ShieldCheck, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

    const DeliveryCard = ({ delivery }: { delivery: any }) => (
        <View 
            className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 mb-4"
        >
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-indigo-500/20 rounded-full items-center justify-center mr-3">
                        <Truck color="#6366F1" size={20} />
                    </View>
                    <View>
                        <Text className="text-white font-bold text-lg">{delivery.item}</Text>
                        <Text className="text-slate-400 text-xs">{delivery.supplier || 'Fournisseur inconnu'}</Text>
                    </View>
                </View>
                <View className="bg-slate-700 px-3 py-1 rounded-full">
                    <Text className="text-white text-[10px] font-bold">
                        {delivery.quantity ? `${delivery.quantity}` : 'Qté N/A'}
                    </Text>
                </View>
            </View>
            
            <View className="flex-row items-center mb-3">
                <Calendar size={14} color="#94A3B8" className="mr-2" />
                <Text className="text-slate-300 text-xs">
                    Prévu le : {new Date(delivery.plannedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
            </View>

            {delivery.notes && (
                <View className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <Text className="text-slate-400 text-xs italic">"{delivery.notes}"</Text>
                </View>
            )}

            <View className="mt-4 pt-4 border-t border-slate-700/50 flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <Box size={14} color="#22C55E" className="mr-1" />
                    <Text className="text-primary text-[10px] font-bold uppercase tracking-tight">
                        {delivery.project.name}
                    </Text>
                </View>
                {user?.role !== 'CHEF_EQUIPE' && (
                    <TouchableOpacity className="bg-primary/20 px-3 py-1.5 rounded-lg border border-primary/30">
                        <Text className="text-primary text-[10px] font-bold">MARQUER REÇU</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View 
            className="flex-1 bg-slate-900"
            style={{ paddingTop: Math.max(insets.top, 24) }}
        >
            <View className="px-5 mb-6 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-slate-800 p-2 rounded-full">
                    <ChevronLeft size={20} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text className="text-white text-2xl font-bold">Planning Livraisons</Text>
                    <Text className="text-slate-400 text-sm">Gestion logistique des chantiers</Text>
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#22C55E" size="large" />
                </View>
            ) : (
                <ScrollView 
                    className="flex-1 px-5"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
                >
                    {deliveries.length > 0 ? (
                        deliveries.map(d => (
                            <DeliveryCard key={d.id} delivery={d} />
                        ))
                    ) : (
                        <View className="items-center justify-center py-20">
                            <View className="bg-slate-800 p-6 rounded-full mb-4">
                                <Truck size={40} color="#475569" />
                            </View>
                            <Text className="text-slate-500 italic text-center px-10">
                                Aucune livraison prévue pour le moment.
                            </Text>
                        </View>
                    )}
                    <View className="h-20" />
                </ScrollView>
            )}
            
            {["ADMIN", "CONDUCTEUR"].includes(user?.role || "") && (
                <TouchableOpacity 
                    className="absolute bottom-10 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-black/50"
                    activeOpacity={0.8}
                >
                    <Text className="text-slate-900 text-2xl font-bold">+</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
