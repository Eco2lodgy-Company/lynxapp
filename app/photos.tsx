import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, StyleSheet, Dimensions, RefreshControl, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Filter, Image as ImageIcon, X, MapPin, Calendar, Clock, ChevronRight } from 'lucide-react-native';
import api, { ASSET_BASE_URL } from '../lib/api';
import { PremiumCard } from '../components/ui/PremiumCard';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

export default function PhotoGalleryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [photos, setPhotos] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [photosRes, projectsRes] = await Promise.all([
                api.get('/photos'),
                api.get('/projects')
            ]);
            setPhotos(photosRes.data);
            setProjects(projectsRes.data);
        } catch (error) {
            console.error("Error fetching gallery data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, []);

    const filteredPhotos = selectedProject 
        ? photos.filter(p => p.project?.id === selectedProject)
        : photos;

    const PhotoViewer = () => (
        <Modal visible={!!selectedPhoto} transparent animationType="fade">
            <View className="flex-1 bg-black/95 justify-center">
                <TouchableOpacity 
                    onPress={() => setSelectedPhoto(null)}
                    className="absolute top-12 right-6 z-50 w-12 h-12 bg-white/10 rounded-full items-center justify-center border border-white/20"
                >
                    <X color="white" size={24} />
                </TouchableOpacity>
                
                {selectedPhoto && (
                    <Animated.View entering={ZoomIn.duration(400)} className="w-full aspect-square">
                        <Image 
                            source={{ uri: `${ASSET_BASE_URL}${selectedPhoto.url}` }}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    </Animated.View>
                )}

                <View className="absolute bottom-12 left-6 right-6">
                    <Text className="text-white text-2xl font-black mb-2">{selectedPhoto?.project?.name}</Text>
                    <View className="flex-row items-center mb-4">
                        <Calendar size={14} color="#E67E22" />
                        <Text className="text-white/60 text-xs font-bold ml-2">
                            {new Date(selectedPhoto?.takenAt || selectedPhoto?.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                    <Text className="text-white/80 text-sm leading-5 italic">"{selectedPhoto?.caption}"</Text>
                </View>
            </View>
        </Modal>
    );

    return (
        <View className="flex-1 bg-white">
            <LinearGradient colors={['#FFFFFF', '#FDFCFB', '#F8F9FA']} style={StyleSheet.absoluteFill} />
            
            <View className="px-6 pb-6" style={{ paddingTop: Math.max(insets.top, 24) }}>
                <View className="flex-row items-center justify-between mb-8">
                    <TouchableOpacity onPress={() => router.back()} className="bg-bg-soft w-12 h-12 rounded-2xl items-center justify-center border border-border-light">
                        <ChevronLeft size={24} color="#4A3520" strokeWidth={3} />
                    </TouchableOpacity>
                    <View className="flex-row items-center bg-bg-warm px-4 py-2 rounded-2xl border border-secondary/5">
                        <ImageIcon size={18} color="#E67E22" />
                        <Text className="text-secondary text-xs font-black ml-2 uppercase tracking-widest">{filteredPhotos.length}</Text>
                    </View>
                </View>

                <Text className="text-secondary/40 text-[10px] font-black uppercase tracking-[4px] mb-1">Photothèque</Text>
                <Text className="text-secondary text-5xl font-black tracking-tight">Galerie</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-8">
                    <TouchableOpacity 
                        onPress={() => setSelectedProject(null)}
                        className={`px-6 py-3 rounded-2xl mr-3 border ${!selectedProject ? 'bg-secondary border-secondary shadow-lg shadow-secondary/20' : 'bg-bg-soft border-border-light'}`}
                    >
                        <Text className={`text-[10px] font-black uppercase tracking-wider ${!selectedProject ? 'text-white' : 'text-secondary/40'}`}>Tous les projets</Text>
                    </TouchableOpacity>
                    {projects.map(p => (
                        <TouchableOpacity 
                            key={p.id}
                            onPress={() => setSelectedProject(p.id)}
                            className={`px-6 py-3 rounded-2xl mr-3 border ${selectedProject === p.id ? 'bg-secondary border-secondary shadow-lg shadow-secondary/20' : 'bg-bg-soft border-border-light'}`}
                        >
                            <Text className={`text-[10px] font-black uppercase tracking-wider ${selectedProject === p.id ? 'text-white' : 'text-secondary/40'}`}>{p.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#E67E22" size="large" />
                </View>
            ) : (
                <ScrollView 
                    className="flex-1" 
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E67E22" />}
                >
                    <View className="flex-row flex-wrap justify-between">
                        {filteredPhotos.map((photo, index) => (
                            <Animated.View 
                                key={photo.id} 
                                entering={FadeInDown.delay(index * 50).duration(600)}
                                className="mb-5"
                                style={{ width: COLUMN_WIDTH }}
                            >
                                <TouchableOpacity 
                                    onPress={() => setSelectedPhoto(photo)}
                                    activeOpacity={0.9}
                                    className="bg-white rounded-[32px] overflow-hidden border border-border-light shadow-sm"
                                    style={{ height: COLUMN_WIDTH }}
                                >
                                    <Image 
                                        source={{ uri: `${ASSET_BASE_URL}${photo.url}` }}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                    />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                                        className="absolute inset-0 justify-end p-4"
                                    >
                                        <Text className="text-white text-[10px] font-black uppercase tracking-wider" numberOfLines={1}>
                                            {photo.project?.name}
                                        </Text>
                                        <Text className="text-white/60 text-[8px] font-bold mt-0.5">
                                            {new Date(photo.takenAt || photo.createdAt).toLocaleDateString('fr-FR')}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>

                    {filteredPhotos.length === 0 && (
                        <View className="items-center justify-center py-20">
                            <ImageIcon size={64} color="#F3F4F6" strokeWidth={1} />
                            <Text className="text-secondary/40 text-lg font-medium mt-4 italic">Aucune photo trouvée</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            <PhotoViewer />
        </View>
    );
}
