import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActionOption {
    label: string;
    icon: string;
    onPress: () => void;
    isDestructive?: boolean;
}

interface CustomActionSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    options: ActionOption[];
}

export default function CustomActionSheet({ visible, onClose, title, options }: CustomActionSheetProps) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <Pressable style={styles.overlay} onPress={onClose}>
                <View style={styles.sheetContainer}>
                    {/* Üstteki Tutamaç Çizgisi */}
                    <View style={styles.handle} />
                    
                    {title && <Text style={styles.title}>{title}</Text>}

                    <View style={styles.optionsContainer}>
                        {options.map((option, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.optionButton, index === options.length - 1 && { borderBottomWidth: 0 }]} 
                                onPress={() => {
                                    onClose();
                                    option.onPress();
                                }}
                            >
                                <View style={[styles.iconBox, { backgroundColor: option.isDestructive ? '#fef2f2' : '#f0f9fa' }]}>
                                    <Ionicons 
                                        name={option.icon as any} 
                                        size={20} 
                                        color={option.isDestructive ? '#ef4444' : '#2F7E8D'} 
                                    />
                                </View>
                                <Text style={[styles.optionLabel, option.isDestructive && { color: '#ef4444' }]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* İptal Butonu */}
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelText}>İptal</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheetContainer: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
    handle: { width: 40, height: 5, backgroundColor: '#e2e8f0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
    title: { fontSize: 16, fontWeight: '700', color: '#64748b', textAlign: 'center', marginBottom: 20 },
    optionsContainer: { backgroundColor: '#f8fafc', borderRadius: 20, overflow: 'hidden', marginBottom: 12 },
    optionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    optionLabel: { fontSize: 16, fontWeight: '600', color: '#102a43' },
    cancelButton: { backgroundColor: 'white', paddingVertical: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    cancelText: { fontSize: 16, fontWeight: '700', color: '#102a43' }
});