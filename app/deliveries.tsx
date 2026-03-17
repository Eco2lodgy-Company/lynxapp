import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, TextInput, Modal, Platform } from 'react-native';
import api from '../lib/api';
import { Truck, Calendar, Box, ShieldCheck, ChevronLeft, Package, Clock, MapPin, AlertTriangle, CheckCircle2, ShoppingCart, Text as TextIcon, Plus, X, Edit2, Trash2, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard } from '../components/ui/PremiumCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import Animated, { FadeInDown, FadeIn, FadeInUp, SlideInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

export default function DeliveriesScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDeliveryId, setCurrentDeliveryId] = useState<string | null>(null);
    
    // Form states
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [item, setItem] = useState("");
    const [quantity, setQuantity] = useState("");
    const [supplier, setSupplier] = useState("");
    const [plannedDate, setPlannedDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

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

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    };

    useEffect(() => {
        fetchDeliveries();
        fetchProjects();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchDeliveries();
        setRefreshing(false);
    }, []);

    const resetForm = () => {
        setItem("");
        setQuantity("");
        setSupplier("");
        setNotes("");
        setPlannedDate(new Date().toISOString().split('T')[0]);
        setSelectedProject(projects.length > 0 ? projects[0].id : "");
        setIsEditing(false);
        setCurrentDeliveryId(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (delivery: any) => {
        setItem(delivery.item || "");
        setQuantity(delivery.quantity || "");
        setSupplier(delivery.supplier || "");
        setNotes(delivery.notes || "");
        setPlannedDate(new Date(delivery.plannedDate).toISOString().split('T')[0]);
        setSelectedProject(delivery.projectId);
        setIsEditing(true);
        setCurrentDeliveryId(delivery.id);
        setModalVisible(true);
    };

    const handleSaveDelivery = async () => {
        if (!selectedProject || !item || !plannedDate) {
            Alert.alert("Erreur", "Veuillez remplir les champs obligatoires");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                projectId: selectedProject,
                item,
                quantity,
                supplier,
                plannedDate,
                notes
            };

            if (isEditing && currentDeliveryId) {
                await api.put(`/deliveries/${currentDeliveryId}`, payload);
                Alert.alert("Succès", "Livraison mise à jour.");
            } else {
                await api.post('/deliveries', payload);
                Alert.alert("Succès", "Mouvement logistique planifié.");
            }
            
            setModalVisible(false);
            fetchDeliveries();
            resetForm();
        } catch (error: any) {
            Alert.alert("Erreur", error.response?.data?.error || "Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDelivery = (id: string) => {
        Alert.alert(
            "Supprimer",
            "Voulez-vous vraiment supprimer ce mouvement logistique ?",
            [
                { text: "Annuler", style: "cancel" },
                { 
                    text: "Supprimer", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/deliveries/${id}`);
                            fetchDeliveries();
                        } catch (error) {
                            Alert.alert("Erreur", "Impossible de supprimer la livraison.");
                        }
                    }
                }
            ]
        );
    };

    const handleReceiveDelivery = async (id: string) => {
        try {
            await api.put(`/deliveries/${id}`, { status: "LIVRÉ" });
            fetchDeliveries();
            Alert.alert("Succès", "Livraison marquée comme réceptionnée.");
        } catch (error) {
            Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'LIVRÉ': return '#10B981';
            case 'URGENT': return '#EF4444';
            case 'ANNULÉ': return '#64748B';
            default: return '#C8842A';
        }
    };

    const DeliveryCard = ({ delivery, index }: { delivery: any, index: number }) => {
        const isUrgent = delivery.status === "URGENT";
        const isDelivered = delivery.status === "LIVRÉ";
        const statusColor = getStatusColor(delivery.status);
        
        return (
            <PremiumCard index={index} glass={true} style={{ padding: 20, marginBottom: 16, borderLeftWidth: isUrgent ? 4 : 0, borderLeftColor: '#EF4444' }}>
                <View className="flex-row justify-between items-start mb-5">
                    <View className="flex-row items-center flex-1 mr-4">
                        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 border`} style={{ backgroundColor: `${statusColor}10`, borderColor: `${statusColor}20` }}>
                            {isDelivered ? <CheckCircle color="#10B981" size={24} /> : (isUrgent ? <AlertTriangle color="#EF4444" size={24} /> : <Truck color="#C8842A" size={24} />)}
                        </View>
                        <View className="flex-1">
                            <View className="flex-row items-center">
                                <Text className={`font-black text-xl tracking-tight mb-1 ${isDelivered ? 'text-slate-500 line-through' : 'text-white'}`}>{delivery.item}</Text>
                                {isUrgent && (
                                    <View className="bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20 ml-3">
                                        <Text className="text-red-500 text-[8px] font-black uppercase tracking-widest">Urgent</Text>
                                    </View>
                                )}
                            </View>
                            <View className="flex-row items-center">
                                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{delivery.supplier || 'Logistique Interne'}</Text>
                            </View>
                        </View>
                    </View>
                    <View className="bg-slate-950/50 px-3 py-1.5 rounded-xl border border-white/5">
                        <Text className="text-primary text-[10px] font-black tracking-widest uppercase">
                            {delivery.quantity || 'Quantité non spécifiée'}
                        </Text>
                    </View>
                </View>
            
            <View className="flex-row items-center mb-5 bg-slate-900/40 self-start px-3 py-2 rounded-xl border border-white/5">
                <Calendar size={14} color={statusColor} />
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
                        {delivery.project?.name}
                    </Text>
                </View>

                {!isDelivered ? (
                    <View className="flex-row items-center">
                        <TouchableOpacity 
                            onPress={() => openEditModal(delivery)}
                            className="w-10 h-10 bg-slate-800 rounded-xl items-center justify-center border border-white/10 mr-2"
                        >
                            <Edit2 size={16} color="#94A3B8" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => handleDeleteDelivery(delivery.id)}
                            className="w-10 h-10 bg-red-500/10 rounded-xl items-center justify-center border border-red-500/20 mr-2"
                        >
                            <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => handleReceiveDelivery(delivery.id)}
                            className="bg-emerald-500/10 border border-emerald-500/30 px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10"
                        >
                            <Text className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Réceptionner</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="flex-row items-center bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                        <CheckCircle size={14} color="#10B981" />
                        <Text className="text-emerald-500 text-[10px] font-black uppercase tracking-widest ml-2">Livré</Text>
                    </View>
                )}
            </View>
        </PremiumCard>
    );};

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
            
            {["ADMIN", "CONDUCTEUR", "CHEF_EQUIPE"].includes(user?.role || "") && (
                <TouchableOpacity 
                    onPress={openCreateModal}
                    className="absolute bottom-10 right-6 bg-primary w-16 h-16 rounded-[24px] items-center justify-center shadow-2xl shadow-primary/30"
                    activeOpacity={0.8}
                >
                    <Plus size={32} color="#020617" strokeWidth={3} />
                </TouchableOpacity>
            )}

            {/* Delivery Form Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={StyleSheet.absoluteFill}>
                    <View className="flex-1 justify-end">
                        <Animated.View 
                            entering={SlideInUp.springify()} 
                            className="bg-slate-900/90 rounded-t-[40px] p-8 h-[92%] border-t border-white/10 shadow-2xl"
                        >
                            <View className="flex-row justify-between items-center mb-10">
                                <View>
                                    <Text className="text-white text-3xl font-black tracking-tight">{isEditing ? 'Modification' : 'Planification'}</Text>
                                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-[2px] mt-1">Movement Logistique</Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => setModalVisible(false)} 
                                    className="w-12 h-12 bg-slate-800 rounded-2xl items-center justify-center border border-white/5"
                                >
                                    <X size={24} color="white" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                                <View className="mb-8">
                                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-1">Projet de Destination</Text>
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
                                </View>

                                <View className="space-y-6">
                                    <Input 
                                        label="Article / Matériel"
                                        placeholder="ex: Béton, Briques..."
                                        value={item}
                                        onChangeText={setItem}
                                    />

                                    <View className="flex-row justify-between">
                                        <View className="flex-1 mr-4">
                                            <Input label="Quantité" placeholder="10 m3" value={quantity} onChangeText={setQuantity} />
                                        </View>
                                        <View className="flex-1">
                                            <Input label="Fournisseur" placeholder="Lafarge" value={supplier} onChangeText={setSupplier} />
                                        </View>
                                    </View>

                                    <Input 
                                        label="Date prévue (AAAA-MM-JJ)"
                                        placeholder="AAAA-MM-JJ"
                                        value={plannedDate}
                                        onChangeText={setPlannedDate}
                                    />

                                    <View className="mb-10">
                                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-3 ml-1">Instructions Logistiques</Text>
                                        <TextInput 
                                            className="bg-slate-950/50 border border-white/5 text-white p-5 rounded-2xl text-base font-medium min-h-[120px]"
                                            placeholder="Détails, horaires, contacts..."
                                            placeholderTextColor="#334155"
                                            multiline
                                            textAlignVertical="top"
                                            value={notes}
                                            onChangeText={setNotes}
                                        />
                                    </View>
                                </View>

                                <Button  
                                    onPress={handleSaveDelivery} 
                                    variant="primary" 
                                    className="w-full h-20 rounded-[28px]"
                                    disabled={saving || !item.trim()}
                                >
                                    {saving ? <ActivityIndicator color="#020617" /> : (isEditing ? "Confirmer les modifications" : "Planifier la livraison")}
                                </Button>
                                
                                {isEditing && (
                                    <TouchableOpacity 
                                        onPress={() => handleDeleteDelivery(currentDeliveryId!)}
                                        className="mt-6 py-4 items-center"
                                    >
                                        <Text className="text-red-500 font-black uppercase tracking-widest text-xs">Supprimer ce mouvement</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </Animated.View>
                    </View>
                </BlurView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({});
