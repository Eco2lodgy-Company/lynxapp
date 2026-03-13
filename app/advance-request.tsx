import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import api from '../lib/api';
import { CircleDollarSign, ChevronLeft, Info, Briefcase, Wallet, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard } from '../components/ui/PremiumCard';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function AdvanceRequestScreen() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await api.get('/projects');
                setProjects(response.data);
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setFetching(false);
            }
        };
        fetchProjects();
    }, []);

    const handleSubmit = async () => {
        if (!selectedProject || !amount || !reason) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs");
            return;
        }

        setLoading(true);
        try {
            await api.post('/advance-requests', {
                projectId: selectedProject,
                amount: parseFloat(amount),
                reason
            });
            Alert.alert("Succès", "Votre demande d'avance a été transmise.");
            router.back();
        } catch (error: any) {
            Alert.alert("Erreur", error.response?.data?.error || "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

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
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[4px] mb-1">Trésorerie de Chantier</Text>
                    <Text className="text-white text-3xl font-black tracking-tight">Financement</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                <PremiumCard index={0} glass={true} style={{ padding: 25, marginBottom: 20 }}>
                    <View className="flex-row items-center mb-10">
                        <View className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center mr-4 border border-primary/20">
                            <Wallet color="#C8842A" size={24} />
                        </View>
                        <View>
                            <Text className="text-white text-xl font-black tracking-tight">Nouvelle Demande</Text>
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Avance sur frais</Text>
                        </View>
                    </View>

                    <View className="mb-10">
                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-1">Projet de Référence</Text>
                        {fetching ? (
                            <ActivityIndicator color="#C8842A" />
                        ) : (
                            <View className="flex-row flex-wrap">
                                {projects.map(p => (
                                    <TouchableOpacity 
                                        key={p.id}
                                        onPress={() => setSelectedProject(p.id)}
                                        className={`mr-3 mb-3 px-5 py-3 rounded-2xl border-2 ${selectedProject === p.id ? 'bg-primary/10 border-primary' : 'bg-slate-950/50 border-white/5'}`}
                                    >
                                        <Text className={`font-bold text-sm ${selectedProject === p.id ? 'text-primary' : 'text-slate-500'}`}>
                                            {p.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <View className="space-y-8">
                        <Input 
                            label="Montant Souhaité (€)"
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            icon={<CircleDollarSign size={20} color="#C8842A" strokeWidth={2.5} />}
                        />

                        <View className="mb-10">
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-3 ml-1">Motif de la demande</Text>
                            <TextInput 
                                className="bg-slate-950/50 border border-white/5 rounded-[24px] p-5 text-white text-base font-medium min-h-[140px]"
                                placeholder="Détaillez le besoin impératif..."
                                placeholderTextColor="#334155"
                                multiline
                                textAlignVertical="top"
                                value={reason}
                                onChangeText={setReason}
                            />
                        </View>
                    </View>

                    <Button 
                        loading={loading}
                        onPress={handleSubmit}
                        className="h-20 rounded-[28px] shadow-2xl shadow-primary/20"
                    >
                        TRANSFÉRER LA DEMANDE
                    </Button>
                </PremiumCard>

                <Animated.View entering={FadeInDown.delay(300)} className="bg-blue-500/5 p-6 rounded-[30px] border border-blue-500/10 flex-row items-center">
                    <View className="w-10 h-10 bg-blue-500/10 rounded-xl items-center justify-center mr-4 border border-blue-500/20">
                        <Info size={18} color="#3B82F6" strokeWidth={2.5} />
                    </View>
                    <Text className="flex-1 text-blue-400 text-[11px] font-medium leading-5">
                        Toute demande est soumise à approbation par le conducteur de travaux. Délai moyen de réponse : <Text className="font-black">2h</Text>.
                    </Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({});
