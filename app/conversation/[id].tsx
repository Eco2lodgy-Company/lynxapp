import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, StyleSheet, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { ASSET_BASE_URL } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { ChevronLeft, Send, Paperclip, Camera, MapPin, Clock, MoreVertical, X, AlertTriangle, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Video, ResizeMode } from 'expo-av';
import Animated, { FadeIn, FadeInDown, SlideInRight, Layout, SlideInUp, FadeOut } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ConversationScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

    const [messages, setMessages] = useState<any[]>([]);
    const [conversation, setConversation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [attachments, setAttachments] = useState<{uri: string, type: string, name: string}[]>([]);

    // Mention logic
    const [showIncidentsMenu, setShowIncidentsMenu] = useState(false);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [loadingIncidents, setLoadingIncidents] = useState(false);
    const [linkedIncident, setLinkedIncident] = useState<any>(null);

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/conversations/${id}`);
            setConversation(res.data);
            setMessages(res.data.messages || []);
        } catch (err) {
            console.error('Error loading conversation:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchIncidents = async () => {
        setLoadingIncidents(true);
        try {
            const res = await api.get('/incidents');
            // Filter active ones
            setIncidents(res.data.filter((inc: any) => inc.status === 'OUVERT' || inc.status === 'EN_COURS'));
        } catch (err) {
            console.error('Error loading incidents:', err);
        } finally {
            setLoadingIncidents(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    }, [messages.length]);

    const handleTextChange = (val: string) => {
        setText(val);
        if (val.endsWith('/') && (user?.role === 'ADMIN' || user?.role === 'CONDUCTEUR' || user?.role === 'CHEF_EQUIPE')) {
            setShowIncidentsMenu(true);
            fetchIncidents();
        } else if (showIncidentsMenu && !val.includes('/')) {
            setShowIncidentsMenu(false);
        }
    };

    const selectIncident = (incident: any) => {
        setLinkedIncident(incident);
        setShowIncidentsMenu(false);
        // Remove the '/' from text
        if (text.endsWith('/')) {
            setText(text.slice(0, -1));
        }
    };

    const sendMessage = async () => {
        if (!text.trim() && attachments.length === 0 && !linkedIncident) return;
        setSending(true);
        const messageText = text.trim();
        const currentIncident = linkedIncident;
        const currentAttachments = [...attachments];
        setText('');
        setLinkedIncident(null);
        setAttachments([]);

        // Optimistic update — show the message instantly
        const optimisticMsg = {
            id: `temp-${Date.now()}`,
            authorId: user?.id,
            author: { firstName: user?.name?.split(' ')[0] || '', lastName: '' },
            content: messageText,
            attachments: [],
            createdAt: new Date().toISOString(),
            _optimistic: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            let uploadedUrls: any[] = [];
            
            // Handle media attachments
            for (const att of currentAttachments) {
                const formData = new FormData();
                formData.append('file', {
                    uri: att.uri,
                    type: att.type,
                    name: att.name
                } as any);

                const uploadRes = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (uploadRes.data?.url) {
                    uploadedUrls.push(uploadRes.data.url);
                }
            }

            // Add linked incident to attachments metadata
            if (currentIncident) {
                uploadedUrls.push({
                    type: 'incident_mention',
                    incidentId: currentIncident.id,
                    title: currentIncident.title,
                    severity: currentIncident.severity
                });
            }

            await api.post('/messages', {
                conversationId: id,
                content: messageText,
                attachments: uploadedUrls,
            });
            setAttachments([]);
            fetchMessages();
        } catch (err: any) {
            Alert.alert('Erreur', err.response?.data?.error || "Impossible d'envoyer le message");
            setText(messageText);
            setLinkedIncident(currentIncident);
            setAttachments(currentAttachments);
            // Remove optimistic message
            setMessages(prev => prev.filter(m => !(m as any)._optimistic));
        } finally {
            setSending(false);
        }
    };

    const pickMedia = async (useCamera: boolean) => {
        try {
            const { status } = useCamera 
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert('Permission requise', 'Accès caméra/galerie nécessaire.');
                return;
            }

            const result = useCamera 
                ? await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.All,
                    allowsEditing: true,
                    quality: 0.5,
                  })
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.All,
                    allowsEditing: true,
                    quality: 0.5,
                  });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const uri = asset.uri;
                const isVideo = asset.type === 'video';
                const type = isVideo ? 'video/mp4' : 'image/jpeg';
                // Always append extension to avoid React Native missing filename matching in FormData boundary parser
                const ext = isVideo ? '.mp4' : '.jpg';
                const baseName = uri.split('/').pop() || `media-${Date.now()}`;
                const name = baseName.includes('.') ? baseName : `${baseName}${ext}`;
                setAttachments(prev => [...prev, { uri, type, name }]);
            }
        } catch (error) {
            console.error('Error picking media:', error);
        }
    };

    const handleAttachPhoto = () => {
        Alert.alert(
            'Joindre un média',
            'Sélecteur de fichiers LYNX',
            [
                { text: 'Appareil Photo', onPress: () => pickMedia(true) },
                { text: 'Bibliothèque', onPress: () => pickMedia(false) },
                { text: 'Annuler', style: 'cancel' },
            ]
        );
    };

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
        if (d.toDateString() === yesterday.toDateString()) return 'Hier';
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    };

    const groupedMessages: { date: string; items: any[] }[] = [];
    let lastDate = '';
    for (const msg of messages) {
        const date = formatDate(msg.createdAt);
        if (date !== lastDate) {
            groupedMessages.push({ date, items: [] });
            lastDate = date;
        }
        groupedMessages[groupedMessages.length - 1].items.push(msg);
    }

    const displayName = conversation?.name ||
        (conversation?.members?.filter((m: any) => m.userId !== user?.id)?.[0]?.user
            ? `${conversation.members.filter((m: any) => m.userId !== user?.id)[0].user.firstName} ${conversation.members.filter((m: any) => m.userId !== user?.id)[0].user.lastName}`
            : 'Discussion');

    const IncidentMentionCard = ({ incident, isMe }: { incident: any, isMe: boolean }) => (
        <TouchableOpacity 
            onPress={() => router.push('/incidents')}
            className={`mt-2 p-4 rounded-2xl border flex-row items-center ${isMe ? 'bg-white/10 border-white/20' : 'bg-white border-slate-100'}`}
        >
            <View className="w-10 h-10 rounded-xl bg-red-500/20 items-center justify-center mr-3">
                <AlertTriangle size={20} color={isMe ? '#FFF' : '#EF4444'} />
            </View>
            <View className="flex-1">
                <Text className={`text-[10px] font-black uppercase tracking-widest ${isMe ? 'text-white/60' : 'text-slate-400'}`}>Incident Mentionné</Text>
                <Text className={`font-black text-sm ${isMe ? 'text-white' : 'text-secondary'}`} numberOfLines={1}>{incident.title}</Text>
            </View>
            <ChevronRight size={16} color={isMe ? '#FFF' : '#4A3520'} />
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-white"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            <LinearGradient
                colors={['#FFFFFF', '#FDFCFB', '#F8F9FA']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Header */}
            <BlurView intensity={Platform.OS === 'ios' ? 90 : 100} tint="light" style={{ paddingTop: insets.top }}>
                <View className="flex-row items-center px-5 py-5 border-b border-border-light/50">
                    <TouchableOpacity onPress={() => router.back()} className="w-11 h-11 bg-bg-soft rounded-2xl items-center justify-center border border-border-light mr-4">
                        <ChevronLeft size={24} color="#E67E22" strokeWidth={3} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-secondary font-black text-xl tracking-tight" numberOfLines={1}>{displayName}</Text>
                        <View className="flex-row items-center mt-0.5">
                            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-500/50" />
                            <Text className="text-secondary/40 text-[10px] font-black uppercase tracking-[3px]" numberOfLines={1}>
                                {conversation?.project ? conversation.project.name : 'CANAL SÉCURISÉ LYNX'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity className="w-11 h-11 bg-bg-soft rounded-2xl items-center justify-center border border-border-light">
                        <MoreVertical size={22} color="#A08060" />
                    </TouchableOpacity>
                </View>
            </BlurView>

            {/* Messages */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#E67E22" size="large" />
                </View>
            ) : (
                <ScrollView
                    ref={scrollRef}
                    className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                >
                    {groupedMessages.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-24 opacity-20">
                            <View className="w-24 h-24 bg-bg-soft rounded-[40px] items-center justify-center mb-8">
                                <Send size={40} color="#4A3520" strokeWidth={1.5} />
                            </View>
                            <Text className="text-secondary font-black text-xs uppercase tracking-[4px] text-center px-10">
                                INITIALISATION DE LA TRANSMISSION
                            </Text>
                        </View>
                    ) : (
                        groupedMessages.map((group, gi) => (
                            <View key={gi}>
                                <View className="flex-row items-center my-10">
                                    <View className="flex-1 h-[1px] bg-border-light/40" />
                                    <View className="bg-bg-soft px-5 py-2 rounded-2xl border border-border-light mx-4 shadow-sm">
                                        <Text className="text-secondary/50 text-[10px] font-black uppercase tracking-[3px]">{group.date}</Text>
                                    </View>
                                    <View className="flex-1 h-[1px] bg-border-light/40" />
                                </View>
                                {group.items.map((msg: any, idx: number) => {
                                    const isMe = msg.authorId === user?.id;
                                    const rawAttachments = msg.attachments ? (typeof msg.attachments === 'string' ? JSON.parse(msg.attachments) : msg.attachments) : [];
                                    
                                    const mediaAttachments = rawAttachments.filter((alt: any) => typeof alt === 'string');
                                    const mentionAttachments = rawAttachments.filter((alt: any) => typeof alt === 'object' && alt.type === 'incident_mention');

                                    return (
                                        <Animated.View 
                                            key={msg.id} 
                                            entering={FadeInDown.delay(idx * 50)}
                                            layout={Layout.springify()}
                                            className={`mb-8 max-w-[88%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                                        >
                                            {!isMe && (
                                                <Text className="text-secondary/40 text-[10px] font-black uppercase tracking-[3px] mb-2 ml-3">
                                                    {msg.author?.firstName} {msg.author?.lastName}
                                                </Text>
                                            )}
                                            
                                            <View className={`p-1.5 rounded-[30px] shadow-sm ${isMe ? 'bg-primary border border-primary/20' : 'bg-bg-soft border border-border-light'}`}>
                                                {mediaAttachments.length > 0 && (
                                                    <View className="mb-1">
                                                        {mediaAttachments.map((url: string, i: number) => {
                                                            const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov');
                                                            return (
                                                                <View key={i} className="w-72 h-72 rounded-[25px] overflow-hidden bg-black/5 items-center justify-center">
                                                                    {isVideo ? (
                                                                        <Video
                                                                            source={{ uri: `${ASSET_BASE_URL}${url}` }}
                                                                            useNativeControls
                                                                            resizeMode={ResizeMode.COVER}
                                                                            style={{ width: '100%', height: '100%' }}
                                                                        />
                                                                    ) : (
                                                                        <Image
                                                                            source={{ uri: `${ASSET_BASE_URL}${url}` }}
                                                                            className="w-full h-full"
                                                                            resizeMode="cover"
                                                                        />
                                                                    )}
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                )}
                                                {msg.content ? (
                                                    <View className="px-5 py-4">
                                                        <Text className={`text-[15px] leading-6 font-bold ${isMe ? 'text-white' : 'text-secondary'}`}>
                                                            {msg.content}
                                                        </Text>
                                                    </View>
                                                ) : null}

                                                {mentionAttachments.length > 0 && (
                                                    mentionAttachments.map((inc: any, ii: number) => (
                                                        <IncidentMentionCard key={ii} incident={inc} isMe={isMe} />
                                                    ))
                                                )}
                                            </View>

                                            <View className={`flex-row items-center mt-2 mx-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                <Text className="text-secondary/30 text-[9px] font-black tracking-[2px] uppercase">
                                                    {formatTime(msg.createdAt)}
                                                </Text>
                                                {isMe && <View className="w-1.5 h-1.5 rounded-full bg-primary mx-2 opacity-40" />}
                                            </View>
                                        </Animated.View>
                                    );
                                })}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Incident Selection Menu */}
            {showIncidentsMenu && (
                <Animated.View entering={SlideInUp} exiting={FadeOut} className="absolute bottom-24 left-5 right-5 z-50">
                    <BlurView intensity={100} tint="dark" className="rounded-[30px] overflow-hidden border border-white/10 shadow-2xl">
                        <View className="p-5 border-b border-white/5 flex-row justify-between items-center">
                            <Text className="text-white font-black text-xs uppercase tracking-[3px]">Mentionner Incident</Text>
                            <TouchableOpacity onPress={() => setShowIncidentsMenu(false)}>
                                <X size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {loadingIncidents ? (
                                <ActivityIndicator color="#E67E22" className="my-10" />
                            ) : incidents.length === 0 ? (
                                <Text className="text-slate-500 text-center py-10 italic">Aucun incident ouvert</Text>
                            ) : incidents.map(inc => (
                                <TouchableOpacity 
                                    key={inc.id}
                                    onPress={() => selectIncident(inc)}
                                    className="p-5 border-b border-white/5 flex-row items-center"
                                >
                                    <View className="w-10 h-10 rounded-xl bg-red-500/20 items-center justify-center mr-4">
                                        <AlertTriangle size={20} color="#EF4444" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-bold" numberOfLines={1}>{inc.title}</Text>
                                        <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{inc.project.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </BlurView>
                </Animated.View>
            )}

            {/* Input Bar */}
            <BlurView intensity={Platform.OS === 'ios' ? 95 : 100} tint="light" style={{ paddingBottom: Math.max(insets.bottom, 20) }} className="border-t border-border-light/50">
                {linkedIncident && (
                    <Animated.View entering={FadeIn} className="px-5 py-3 bg-primary/10 flex-row items-center justify-between border-b border-primary/20">
                        <View className="flex-row items-center flex-1">
                            <AlertTriangle size={14} color="#C8842A" />
                            <Text className="text-primary font-black text-xs ml-3" numberOfLines={1}>Lié à: {linkedIncident.title}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setLinkedIncident(null)}>
                            <X size={16} color="#C8842A" />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {attachments.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 py-5 bg-white/50">
                        {attachments.map((att, i) => (
                            <View key={i} className="mr-5 relative">
                                <View className="w-24 h-24 rounded-[24px] border border-border-light overflow-hidden shadow-sm">
                                    <Image source={{ uri: att.uri }} className="w-full h-full" />
                                </View>
                                <TouchableOpacity 
                                    onPress={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                    className="absolute -top-2 -right-2 bg-secondary rounded-full w-8 h-8 items-center justify-center border-2 border-white shadow-xl"
                                >
                                    <X color="white" size={16} strokeWidth={3} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
                
                <View className="px-5 py-6 flex-row items-center">
                    <TouchableOpacity
                        onPress={handleAttachPhoto}
                        className="w-14 h-14 rounded-2xl bg-bg-soft items-center justify-center border border-border-light mr-4 shadow-sm"
                    >
                        <Paperclip size={24} color="#E67E22" strokeWidth={2.5} />
                    </TouchableOpacity>

                    <View className="flex-1 bg-bg-soft border border-border-light rounded-[28px] px-6 py-2 min-h-[58px] justify-center shadow-inner">
                        <TextInput
                            className="text-secondary text-[16px] font-bold py-3"
                            placeholder="Transmission sécurisée..."
                            placeholderTextColor="#A08060"
                            value={text}
                            onChangeText={handleTextChange}
                            multiline
                            style={{ maxHeight: 120 }}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={sending || (!text.trim() && attachments.length === 0 && !linkedIncident)}
                        className={`w-14 h-14 rounded-2xl items-center justify-center ml-4 shadow-2xl ${(text.trim() || attachments.length > 0 || linkedIncident) ? 'bg-primary shadow-primary/40' : 'bg-bg-soft border border-border-light'}`}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Send size={24} color={(text.trim() || attachments.length > 0 || linkedIncident) ? 'white' : '#A08060'} strokeWidth={3} />
                        )}
                    </TouchableOpacity>
                </View>
            </BlurView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({});
