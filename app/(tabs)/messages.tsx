import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Image, StyleSheet, Platform, Modal, Alert } from 'react-native';
import api from '../../lib/api';
import { MessageSquare, ChevronRight, User, Search, Plus, X } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard } from '../../components/ui/PremiumCard';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Input } from '../../components/ui/Input';

export default function MessagesScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [showNewChannel, setShowNewChannel] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [channelName, setChannelName] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchConversations = async () => {
        try {
            const response = await api.get('/conversations');
            setConversations(response.data);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchConversations();
        setRefreshing(false);
    }, []);

    const openNewChannel = async () => {
        setShowNewChannel(true);
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (e) {
            console.error('Error loading projects:', e);
        }
    };

    const handleCreateChannel = async () => {
        if (!selectedProject) {
            Alert.alert('Projet requis', 'Sélectionnez un projet pour créer le canal.');
            return;
        }
        setCreating(true);
        try {
            const res = await api.post('/conversations', {
                name: channelName || undefined,
                projectId: selectedProject,
                participantIds: [],
            });
            setShowNewChannel(false);
            setChannelName('');
            setSelectedProject(null);
            await fetchConversations();
            router.push(`/conversation/${res.data.id}`);
        } catch (err: any) {
            Alert.alert('Erreur', err.response?.data?.error || 'Impossible de créer le canal');
        } finally {
            setCreating(false);
        }
    };

    const ConversationCard = ({ conversation, index }: { conversation: any, index: number }) => {
        const lastMessage = conversation.messages?.[0];
        const otherMembers = conversation.members.filter((m: any) => m.userId !== user?.id);
        const displayName = conversation.name || (otherMembers.length > 0 ? `${otherMembers[0].user.firstName} ${otherMembers[0].user.lastName}` : "Discussion");

        return (
            <PremiumCard index={index} glass={true} style={{ padding: 16, marginBottom: 16, borderRadius: 28 }}>
                <TouchableOpacity 
                    className="flex-row items-center"
                    activeOpacity={0.7}
                    onPress={() => router.push(`/conversation/${conversation.id}`)}
                >
                    <View className="relative">
                        <View className="w-16 h-16 rounded-[24px] bg-bg-soft items-center justify-center mr-5 border border-border-light overflow-hidden">
                            <User size={30} color="#4A3520" strokeWidth={2} />
                        </View>
                    </View>
                    
                    <View className="flex-1">
                        <View className="flex-row justify-between items-center mb-1.5">
                            <Text className="text-secondary font-black text-[17px] tracking-tight" numberOfLines={1}>
                                {displayName}
                            </Text>
                            {lastMessage && (
                                <Text className="text-secondary/30 text-[10px] font-black uppercase tracking-[2px]">
                                    {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            )}
                        </View>
                        
                        <Text className="text-secondary/50 text-[14px] font-bold leading-5" numberOfLines={1}>
                            {lastMessage ? (
                                <><Text className="text-primary/80">{lastMessage.author.firstName}: </Text>{lastMessage.content || '📎 Pièce jointe'}</>
                            ) : "Début de la transmission..."}
                        </Text>
                        
                        {conversation.project && (
                            <View className="mt-3 bg-primary/5 self-start px-3 py-1.5 rounded-xl border border-primary/10">
                                <Text className="text-primary text-[9px] font-black uppercase tracking-[3px]">
                                    {conversation.project.name}
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    <View className="bg-bg-soft p-2.5 rounded-2xl ml-3">
                        <ChevronRight color="#E67E22" size={18} strokeWidth={3} />
                    </View>
                </TouchableOpacity>
            </PremiumCard>
        );
    };

    return (
        <View className="flex-1 bg-white">
            <LinearGradient
                colors={['#FFFFFF', '#FDFCFB', '#F8F9FA']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            <View 
                className="flex-1 px-5"
                style={{ paddingTop: Math.max(insets.top, 24) }}
            >
                <Animated.View entering={FadeInUp.duration(600)} className="mb-10 flex-row justify-between items-end">
                    <View>
                        <Text className="text-secondary/40 text-sm font-black uppercase tracking-[5px] mb-2">Canaux Sécurisés</Text>
                        <Text className="text-secondary text-4xl font-black tracking-tighter">Messages</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={openNewChannel}
                        className="w-14 h-14 bg-primary rounded-2xl items-center justify-center shadow-xl shadow-primary/40"
                    >
                        <Plus size={28} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                </Animated.View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#E67E22" size="large" />
                    </View>
                ) : (
                    <ScrollView 
                        className="flex-1"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E67E22" />}
                    >
                        {conversations.length > 0 ? (
                            conversations.map((conv, index) => (
                                <ConversationCard key={conv.id} conversation={conv} index={index} />
                            ))
                        ) : (
                            <View className="items-center justify-center py-24 bg-bg-soft/50 rounded-[40px] border border-border-light">
                                <View className="w-24 h-24 bg-white rounded-[35px] items-center justify-center mb-8 shadow-sm">
                                    <MessageSquare size={40} color="#F2F2F2" strokeWidth={1.5} />
                                </View>
                                <Text className="text-secondary/30 font-black text-xs uppercase tracking-[4px] text-center px-10">
                                    Aucune discussion active
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>

            {/* New Channel Modal */}
            <Modal visible={showNewChannel} transparent animationType="fade" onRequestClose={() => setShowNewChannel(false)}>
                <View className="flex-1 bg-black/60 justify-center items-center px-6">
                    <Animated.View entering={FadeInUp} className="bg-white rounded-[36px] w-full p-8 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-8">
                            <View>
                                <Text className="text-secondary text-2xl font-black tracking-tight">Nouveau Canal</Text>
                                <Text className="text-secondary/40 text-[10px] font-black uppercase tracking-widest mt-1">Sélectionnez un projet</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowNewChannel(false)} className="w-12 h-12 bg-bg-soft rounded-full items-center justify-center">
                                <X size={20} color="#4A3520" />
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Nom du canal (optionnel)"
                            placeholder="Ex: Discussion Équipe..."
                            value={channelName}
                            onChangeText={setChannelName}
                        />

                        <Text className="text-[10px] font-black text-secondary mb-3 ml-1 uppercase tracking-[3px] mt-4">Projet</Text>
                        <ScrollView style={{ maxHeight: 200 }} className="mb-6">
                            {projects.map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    onPress={() => setSelectedProject(p.id)}
                                    className={`p-4 mb-2 rounded-2xl border-2 ${selectedProject === p.id ? 'border-primary bg-primary/5' : 'border-border-light bg-bg-soft'}`}
                                >
                                    <Text className={`font-black ${selectedProject === p.id ? 'text-primary' : 'text-secondary'}`}>{p.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={handleCreateChannel}
                            disabled={creating}
                            className="bg-secondary h-16 rounded-2xl items-center justify-center shadow-lg"
                        >
                            {creating ? <ActivityIndicator color="white" /> : (
                                <Text className="text-white font-black uppercase tracking-widest">Créer le Canal</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({});
