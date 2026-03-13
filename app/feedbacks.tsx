import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import api, { ASSET_BASE_URL } from '../lib/api';
import { Camera, MapPin, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../components/ui/Input';

export default function FeedbacksScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [lightbox, setLightbox] = useState<any | null>(null);
    const insets = useSafeAreaInsets();

    const fetchPhotos = async () => {
        try {
            const response = await api.get('/photos');
            setPhotos(response.data);
        } catch (error) {
            console.error("Error fetching photos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchPhotos();
        setRefreshing(false);
    }, []);

    const filteredPhotos = photos.filter(p => 
        (p.caption?.toLowerCase() || "").includes(search.toLowerCase()) ||
        p.project?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View className="flex-1 bg-slate-900" style={{ paddingTop: Math.max(insets.top, 24) }}>
            <View className="px-5 mb-5">
                <Text className="text-primary text-[10px] font-bold uppercase tracking-widest mb-1">Espace Client</Text>
                <Text className="text-white text-3xl font-black tracking-tight mb-1">Galerie</Text>
                <Text className="text-slate-400 text-sm">Photos validées de vos chantiers</Text>
            </View>

            <View className="px-5 mb-6">
                <Input 
                    placeholder="Rechercher une photo, projet..." 
                    value={search}
                    onChangeText={setSearch}
                    icon={<Search size={20} color="#64748B" />}
                />
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#22C55E" size="large" />
                </View>
            ) : (
                <ScrollView
                    className="flex-1 px-5"
                    contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
                    showsVerticalScrollIndicator={false}
                >
                    {filteredPhotos.length === 0 ? (
                        <View className="items-center justify-center py-20">
                            <View className="w-16 h-16 bg-slate-800 rounded-full items-center justify-center mb-4">
                                <Camera size={32} color="#475569" />
                            </View>
                            <Text className="text-white font-bold text-lg mb-2">Aucune photo</Text>
                            <Text className="text-slate-400 text-center">Les photos validées apparaîtront ici.</Text>
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap justify-between">
                            {filteredPhotos.map((photo) => (
                                <TouchableOpacity 
                                    key={photo.id}
                                    onPress={() => setLightbox(photo)}
                                    className="w-[48%] aspect-square bg-slate-800 rounded-2xl overflow-hidden mb-4 border border-slate-700/50"
                                    activeOpacity={0.8}
                                >
                                    {/* Using standard URL construction assuming valid URLs returned */}
                                    <Image 
                                        source={{ uri: photo.url.startsWith('http') ? photo.url : `${ASSET_BASE_URL}${photo.url}` }} 
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                    <View className="absolute inset-0 bg-black/40 justify-end p-3">
                                        <Text className="text-white font-bold text-xs" numberOfLines={1}>{photo.project?.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Lightbox Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={!!lightbox}
                onRequestClose={() => setLightbox(null)}
            >
                <View className="flex-1 bg-black justify-center items-center">
                    <TouchableOpacity 
                        className="absolute top-12 right-6 z-50 p-2 bg-slate-800/80 rounded-full"
                        onPress={() => setLightbox(null)}
                    >
                        <X color="#FFF" size={24} />
                    </TouchableOpacity>

                    {lightbox && (
                        <View className="w-full h-full max-h-[80%] justify-center px-4">
                            <Image 
                                source={{ uri: lightbox.url.startsWith('http') ? lightbox.url : `${ASSET_BASE_URL}${lightbox.url}` }} 
                                className="w-full h-[70%] rounded-xl"
                                resizeMode="contain"
                            />
                            
                            <View className="mt-6 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                                {lightbox.caption && (
                                    <Text className="text-white text-base mb-3 leading-6">{lightbox.caption}</Text>
                                )}
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-primary font-bold">{lightbox.project?.name}</Text>
                                        <Text className="text-slate-400 text-xs mt-1">
                                            {new Date(lightbox.takenAt || lightbox.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                                        <Text className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                                            {lightbox.source === 'REPORT' ? 'Rapport' : 'Message'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}
