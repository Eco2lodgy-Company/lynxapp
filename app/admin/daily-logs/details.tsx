import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Check, X, Calendar, User, Thermometer, Sun, Cloud, CloudRain, Briefcase } from 'lucide-react-native';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function DailyLogDetailsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    
    const [log, setLog] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const fetchLog = async () => {
        try {
            const response = await api.get(`/daily-logs/${id}`);
            setLog(response.data);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger le rapport');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLog();
    }, [id]);

    const updateStatus = async (status: string, rejectionNote = '') => {
        setProcessing(true);
        try {
            await api.put(`/daily-logs/${id}`, { status, rejectionNote });
            Alert.alert('Succès', `Rapport ${status === 'VALIDE' ? 'validé' : 'rejeté'}`);
            fetchLog();
        } catch (error) {
            Alert.alert('Erreur', 'L\'opération a échoué');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = () => {
        Alert.prompt(
            'Motif du rejet',
            'Veuillez expliquer pourquoi ce rapport est rejeté :',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Rejeter', style: 'destructive', onPress: (note) => updateStatus('REJETE', note) }
            ]
        );
    };

    if (loading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#E67E22" size="large" /></View>;

    const WeatherIcon = log.weather === 'ENSOLEILLE' ? Sun : log.weather === 'PLUVIEUX' ? CloudRain : Cloud;

    return (
        <View className="flex-1 bg-white">
            <LinearGradient colors={['#FFFFFF', '#FDFCFB', '#F8F9FA']} style={StyleSheet.absoluteFill} />
            
            <View className="px-6 pb-6 border-b border-secondary/5" style={{ paddingTop: Math.max(insets.top, 24) }}>
                <TouchableOpacity onPress={() => router.back()} className="mb-6 bg-bg-soft w-12 h-12 rounded-2xl items-center justify-center border border-border-light">
                    <ChevronLeft size={24} color="#4A3520" strokeWidth={3} />
                </TouchableOpacity>
                <View className="flex-row justify-between items-end">
                    <View className="flex-1 mr-4">
                        <Text className="text-secondary/40 text-[10px] font-black uppercase tracking-[4px] mb-1">Détails du rapport</Text>
                        <Text className="text-secondary text-3xl font-black tracking-tight">{log.project?.name}</Text>
                    </View>
                    <View className="bg-bg-warm px-3 py-1.5 rounded-xl border border-secondary/10">
                        <Text className="text-secondary text-[10px] font-black uppercase tracking-wider">
                            {new Date(log.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
                <Animated.View entering={FadeInUp.duration(600)} className="px-6 pt-8">
                    {/* Header Info */}
                    <View className="flex-row space-x-3 mb-8">
                        <View className="flex-1 bg-bg-soft rounded-3xl p-4 border border-border-light flex-row items-center">
                            <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center mr-3 shadow-sm shadow-secondary/5">
                                <WeatherIcon size={20} color="#E67E22" />
                            </View>
                            <View>
                                <Text className="text-secondary/40 text-[8px] font-black uppercase tracking-widest">Météo</Text>
                                <Text className="text-secondary text-xs font-bold">{log.weather?.charAt(0) + log.weather?.slice(1).toLowerCase()}</Text>
                            </View>
                        </View>
                        <View className="flex-1 bg-bg-soft rounded-3xl p-4 border border-border-light flex-row items-center">
                            <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center mr-3 shadow-sm shadow-secondary/5">
                                <Thermometer size={20} color="#E67E22" />
                            </View>
                            <View>
                                <Text className="text-secondary/40 text-[8px] font-black uppercase tracking-widest">Temp.</Text>
                                <Text className="text-secondary text-xs font-bold">{log.temperature}°C</Text>
                            </View>
                        </View>
                    </View>

                    {/* Content Sections */}
                    <View className="mb-8">
                        <Text className="text-secondary/40 text-[10px] font-black uppercase tracking-[3px] mb-3 ml-1">Résumé de l'activité</Text>
                        <View className="bg-bg-soft rounded-[30px] p-6 border border-border-light">
                            <Text className="text-secondary text-base leading-6 font-medium font-serif italic text-secondary/80">
                                "{log.summary}"
                            </Text>
                        </View>
                    </View>

                    {log.workCompleted && (
                        <View className="mb-8">
                            <Text className="text-secondary/40 text-[10px] font-black uppercase tracking-[3px] mb-3 ml-1">Tâches Finies</Text>
                            <View className="bg-bg-soft rounded-3xl p-5 border border-border-light">
                                <Text className="text-secondary/70 text-sm font-bold leading-5">{log.workCompleted}</Text>
                            </View>
                        </View>
                    )}

                    {log.issues && (
                        <View className="mb-8">
                            <Text className="text-red-900/40 text-[10px] font-black uppercase tracking-[3px] mb-3 ml-1">Incidents / Retards</Text>
                            <View className="bg-red-50/50 rounded-3xl p-5 border border-red-100">
                                <Text className="text-red-900 text-sm font-bold leading-5">{log.issues}</Text>
                            </View>
                        </View>
                    )}

                    {/* Photos Grid */}
                    {log.photos && log.photos.length > 0 && (
                        <View className="mb-8">
                            <Text className="text-secondary/40 text-[10px] font-black uppercase tracking-[3px] mb-4 ml-1">Photos du Terrain</Text>
                            <View className="flex-row flex-wrap">
                                {log.photos.map((p: any, idx: number) => (
                                    <TouchableOpacity key={idx} className="w-[48%] aspect-square mr-[2%] mb-[2%] rounded-3xl overflow-hidden shadow-sm">
                                        <Image source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${p.url}` }} className="w-full h-full" resizeMode="cover" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Author Footer */}
                    <View className="flex-row items-center bg-bg-warm/50 p-4 rounded-3xl border border-secondary/5 mb-10">
                        <View className="w-12 h-12 rounded-full bg-secondary/10 items-center justify-center mr-4 border border-secondary/10">
                            <User size={20} color="#4A3520" />
                        </View>
                        <View>
                            <Text className="text-secondary/40 text-[8px] font-black uppercase tracking-widest">Rédigé par</Text>
                            <Text className="text-secondary text-sm font-black">{log.author?.firstName} {log.author?.lastName}</Text>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Admin/Conducteur Actions */}
            {log.status === 'SOUMIS' && (user?.role === 'ADMIN' || user?.role === 'CONDUCTEUR') && (
                <View 
                    className="absolute bottom-0 left-0 right-0 p-6 pt-4 bg-white/95 border-t border-secondary/5 blur-lg"
                    style={{ paddingBottom: Math.max(insets.bottom, 24) }}
                >
                    <View className="flex-row space-x-3">
                        <TouchableOpacity 
                            onPress={handleReject}
                            className="flex-1 h-14 bg-red-50 border border-red-100 rounded-2xl items-center justify-center"
                        >
                            <X size={20} color="#EF4444" strokeWidth={3} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => updateStatus('VALIDE')}
                            disabled={processing}
                            className="flex-[3] h-14 bg-secondary rounded-2xl items-center justify-center shadow-lg shadow-secondary/20"
                        >
                            {processing ? <ActivityIndicator color="white" /> : (
                                <View className="flex-row items-center">
                                    <Check size={20} color="white" strokeWidth={3} className="mr-2" />
                                    <Text className="text-white font-black uppercase text-base">Valider le rapport</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}
