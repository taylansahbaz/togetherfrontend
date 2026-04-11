import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void; // Soru işareti ekledik (Zorunlu değil)
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'success' | 'info';
  showCancelButton?: boolean; // YENİ: İptal butonunu gizlemek için
}

export default function CustomAlert({ 
  visible, title, message, onConfirm, onCancel, 
  confirmText = "Tamam", cancelText = "İptal", type = 'info', showCancelButton = true
}: CustomAlertProps) {
  
  const getIcon = () => {
    switch(type) {
      case 'danger': return { name: 'trash-outline', color: '#ef4444' };
      case 'success': return { name: 'checkmark-circle-outline', color: '#10b981' };
      default: return { name: 'information-circle-outline', color: '#2F7E8D' };
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <View style={[styles.iconCircle, { backgroundColor: getIcon().color + '20' }]}>
            <Ionicons name={getIcon().name as any} size={32} color={getIcon().color} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {showCancelButton !== false && (
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <Text style={styles.cancelText}>{cancelText}</Text>
                </TouchableOpacity>
            )}
            
            <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: getIcon().color }]} 
                onPress={onConfirm}
            >
                <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
        </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { width: Dimensions.get('window').width * 0.85, backgroundColor: 'white', borderRadius: 24, padding: 24, alignItems: 'center' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#102a43', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  buttonContainer: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 14, backgroundColor: '#f1f5f9' },
  confirmButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  cancelText: { color: '#64748b', fontWeight: '700' },
  confirmText: { color: 'white', fontWeight: '700' },
});