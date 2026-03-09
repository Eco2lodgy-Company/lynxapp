import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import api from '../../lib/api';
import { MessageSquare, ChevronRight, User } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MessagesScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

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

    const ConversationCard = ({ conversation }: { conversation: any }) => {
        const lastMessage = conversation.messages?.[0];
        const otherMembers = conversation.members.filter((m: any) => m.userId !== user?.id);
        const displayName = conversation.name || (otherMembers.length > 0 ? `${otherMembers[0].user.firstName} ${otherMembers[0].user.lastName}` : "Discussion");

        return (
            <TouchableOpacity 
                className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 mb-3 flex-row items-center"
                activeOpacity={0.7}
            >
                <View className="w-12 h-12 rounded-2xl bg-slate-800 items-center justify-center mr-4 border border-white/5">
                    <User size={24} color="#14F195" />
                </View>
                
                <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-white font-bold text-base" numberOfLines={1}>
                            {displayName}
                        </Text>
                        {lastMessage && (
                            <Text className="text-slate-500 text-[10px]">
                                {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        )}
                    </View>
                    
                    <Text className="text-slate-400 text-xs" numberOfLines={1}>
                        {lastMessage ? `${lastMessage.author.firstName}: ${lastMessage.content}` : "Aucun message"}
                    </Text>
                    
                    {conversation.project && (
                        <View className="mt-2 bg-primary/10 self-start px-2.5 py-1 rounded-full border border-primary/20">
                            <Text className="text-primary text-[8px] font-bold uppercase tracking-wider">
                                {conversation.project.name}
                            </Text>
                        </View>
                    )}
                </View>
                
                <ChevronRight size={18} color="#475569" className="ml-2" />
            </TouchableOpacity>
        );
    };

    return (
        <View 
            className="flex-1 bg-slate-900 px-5"
            style={{ paddingTop: Math.max(insets.top, 24) }}
        >
            <View className="mb-6 flex-row justify-between items-end">
                <View>
                    <Text className="text-white text-3xl font-bold mb-2">Messages</Text>
                    <Text className="text-slate-400 text-sm">Discussions directes et canaux chantiers</Text>
                </View>
                <TouchableOpacity className="bg-primary p-2 rounded-full mb-1">
                    <MessageSquare size={20} color="#0F172A" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#22C55E" size="large" />
                </View>
            ) : (
                <ScrollView 
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
                >
                    {conversations.length > 0 ? (
                        conversations.map(conv => (
                            <ConversationCard key={conv.id} conversation={conv} />
                        ))
                    ) : (
                        <View className="items-center justify-center py-20">
                            <View className="bg-slate-800 p-6 rounded-full mb-4">
                                <MessageSquare size={40} color="#475569" />
                            </View>
                            <Text className="text-slate-500 italic text-center px-10">
                                Aucune discussion trouvée. Commencez à échanger avec vos collaborateurs.
                            </Text>
                        </View>
                    )}
                    <View className="h-20" />
                </ScrollView>
            )}
        </View>
    );
}
