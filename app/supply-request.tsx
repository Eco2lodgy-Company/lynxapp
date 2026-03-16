import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import api from '../lib/api';
import { Package, ChevronLeft, Info, Briefcase, ShoppingCart, Send, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard } from '../components/ui/PremiumCard';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function SupplyRequestScreen() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [item, setItem] = useState("");
    const [quantity, setQuantity] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // Fetch projects donde le chef est affecté
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
        if (!selectedProject || !item || !quantity) {
            Alert.alert("Erreur", "Veuillez remplir les informations essentielles (Projet, Matériel, Quantité)");
            return;
        }

        setLoading(true);
        try {
            await api.post('/deliveries', {
                projectId: selectedProject,
                item,
                quantity,
                plannedDate: new Date().toISOString(), // Immediate signal
                notes: notes ? `SIGNALEMENT RUPTURE : ${notes}` : "SIGNALEMENT RUPTURE DE STOCK"
            });
            Alert.alert("Succès", "Rupture de stock signalée au conducteur.");
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
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[4px] mb-1">Ressources & Matériaux</Text>
                    <Text className="text-white text-3xl font-black tracking-tight">Approvisionnement</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                <PremiumCard index={0} glass={true} style={{ padding: 25, marginBottom: 20 }}>
                    <View className="flex-row items-center mb-10">
                        <View className="w-12 h-12 bg-orange-500/10 rounded-2xl items-center justify-center mr-4 border border-orange-500/20">
                            <AlertTriangle color="#F59E0B" size={24} />
                        </View>
                        <View>
                            <Text className="text-white text-xl font-black tracking-tight">Signaler Rupture</Text>
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Alerte stock critique</Text>
                        </View>
                    </View>

                    <View className="mb-10">
                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-1">Chantier Concerné</Text>
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
                            label="Matériel Manquant"
                            placeholder="ex: Ciment, Sable, Acier..."
                            value={item}
                            onChangeText={setItem}
                            icon={<Package size={20} color="#C8842A" strokeWidth={2.5} />}
                        />

                        <Input 
                            label="Quantité / Estimation"
                            placeholder="ex: 10 sacs, 2 tonnes..."
                            value={quantity}
                            onChangeText={setQuantity}
                            icon={<ShoppingCart size={20} color="#C8842A" strokeWidth={2.5} />}
                        />

                        <View className="mb-10">
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-3 ml-1">Commentaires (Optionnel)</Text>
                            <TextInput 
                                className="bg-slate-950/50 border border-white/5 rounded-[24px] p-5 text-white text-base font-medium min-h-[140px]"
                                placeholder="Détails sur l'urgence ou spécifications..."
                                placeholderTextColor="#334155"
                                multiline
                                textAlignVertical="top"
                                value={notes}
                                onChangeText={setNotes}
                            />
                        </View>
                    </View>

                    <Button 
                        loading={loading}
                        onPress={handleSubmit}
                        className="h-20 rounded-[28px] shadow-2xl shadow-primary/20"
                    >
                        SIGNALER AU CONDUCTEUR
                    </Button>
                </PremiumCard>

                <Animated.View entering={FadeInDown.delay(300)} className="bg-orange-500/5 p-6 rounded-[30px] border border-orange-500/10 flex-row items-center">
                    <View className="w-10 h-10 bg-orange-500/10 rounded-xl items-center justify-center mr-4 border border-orange-500/20">
                        <Info size={18} color="#F59E0B" strokeWidth={2.5} />
                    </View>
                    <Text className="flex-1 text-orange-400 text-[11px] font-medium leading-5">
                        Ce signalement sera immédiatement ajouté au <Text className="font-black">Planning Logistique</Text> du conducteur pour action.
                    </Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({});
