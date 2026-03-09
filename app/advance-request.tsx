import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import api from '../lib/api';
import { CircleDollarSign, ChevronLeft, Info, Briefcase } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';

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
        <View 
            className="flex-1 bg-slate-900"
            style={{ paddingTop: Math.max(insets.top, 24) }}
        >
            <View className="px-5 mb-8 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-slate-800 p-2 rounded-full">
                    <ChevronLeft size={20} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text className="text-white text-2xl font-bold">Demande d'Avance</Text>
                    <Text className="text-slate-400 text-sm">Financement exceptionnel de chantier</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                <View className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl mb-6">
                    <View className="mb-6">
                        <Text className="text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Chantier Concerné</Text>
                        {fetching ? (
                            <ActivityIndicator color="#22C55E" />
                        ) : (
                            <View className="flex-row flex-wrap">
                                {projects.map(p => (
                                    <TouchableOpacity 
                                        key={p.id}
                                        onPress={() => setSelectedProject(p.id)}
                                        className={`mr-2 mb-2 px-4 py-2 rounded-xl border ${selectedProject === p.id ? 'bg-primary border-primary' : 'bg-slate-900 border-slate-700'}`}
                                    >
                                        <Text className={`text-xs font-bold ${selectedProject === p.id ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {p.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <View className="mb-6">
                        <Text className="text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Montant Souhaité (€)</Text>
                        <View className="bg-slate-900 border border-slate-700 rounded-2xl flex-row items-center px-4">
                            <CircleDollarSign size={20} color="#94A3B8" />
                            <TextInput 
                                className="flex-1 h-14 text-white font-bold text-lg ml-3"
                                placeholder="0.00"
                                placeholderTextColor="#475569"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>
                    </View>

                    <View className="mb-8">
                        <Text className="text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Motif de la demande</Text>
                        <TextInput 
                            className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white text-base min-h-[120px]"
                            placeholder="Détaillez le besoin (matériel urgent, frais, etc.)..."
                            placeholderTextColor="#475569"
                            multiline
                            textAlignVertical="top"
                            value={reason}
                            onChangeText={setReason}
                        />
                    </View>

                    <Button 
                        loading={loading}
                        onPress={handleSubmit}
                        className="bg-primary h-14 rounded-2xl"
                    >
                        ENVOYER LA DEMANDE
                    </Button>
                </View>

                <View className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 flex-row">
                    <Info size={18} color="#3B82F6" className="mr-3 mt-0.5" />
                    <Text className="flex-1 text-blue-300 text-xs leading-5">
                        Toute demande sera notifiée instantanément au Conducteur de travaux et à l'Administration pour validation.
                    </Text>
                </View>
                
                <View className="h-20" />
            </ScrollView>
        </View>
    );
}
