import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { RouteProp, NavigationProp } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';

import { ProjectsStackParamList } from '../../navigation/MainNavigator';
import { RootState, AppDispatch } from '../../store';
import { Point, addPoint, setPoints, setSelectedPoint } from '../../store/slices/pointsSlice';
import InteractiveFloorPlan from '../../components/floorplan/InteractiveFloorPlan';

interface Props {
  route: RouteProp<ProjectsStackParamList, 'FloorPlan'>;
  navigation: NavigationProp<ProjectsStackParamList, 'FloorPlan'>;
}

const FloorPlanScreen: React.FC<Props> = ({ route, navigation }) => {
  const { projectId, floorId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { points, selectedPoint } = useSelector((state: RootState) => state.points);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPointCoords, setNewPointCoords] = useState<{ x: number; y: number } | null>(null);
  const [pointForm, setPointForm] = useState({
    pointNumber: '',
    type: 'data' as Point['type'],
    category: 'Cat6' as Point['category'],
    description: '',
  });

  // Mock data for development
  const mockPoints: Point[] = [
    {
      id: '1',
      pointNumber: 'P001',
      projectId,
      floorId: floorId || 'floor1',
      type: 'data',
      category: 'Cat6',
      status: 'installed',
      coordinates: { x: 150, y: 100 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      pointNumber: 'P002',
      projectId,
      floorId: floorId || 'floor1',
      type: 'voice',
      category: 'Cat5e',
      status: 'tested',
      coordinates: { x: 250, y: 150 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      pointNumber: 'P003',
      projectId,
      floorId: floorId || 'floor1',
      type: 'fiber',
      category: 'Fiber',
      status: 'certified',
      coordinates: { x: 180, y: 250 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    // Load points for this floor
    dispatch(setPoints(mockPoints));
  }, [projectId, floorId, dispatch]);

  const handleAddPoint = (x: number, y: number) => {
    setNewPointCoords({ x, y });
    setShowAddModal(true);
  };

  const handleSavePoint = () => {
    if (!pointForm.pointNumber.trim()) {
      Alert.alert('Error', 'Point number is required');
      return;
    }

    if (!newPointCoords) return;

    const newPoint: Point = {
      id: `point_${Date.now()}`,
      pointNumber: pointForm.pointNumber.trim(),
      projectId,
      floorId: floorId || 'floor1',
      type: pointForm.type,
      category: pointForm.category,
      status: 'planned',
      coordinates: newPointCoords,
      description: pointForm.description.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch(addPoint(newPoint));
    setShowAddModal(false);
    setPointForm({
      pointNumber: '',
      type: 'data',
      category: 'Cat6',
      description: '',
    });
    setNewPointCoords(null);
    Alert.alert('Success', 'Point added successfully');
  };

  const handlePointPress = (point: Point) => {
    dispatch(setSelectedPoint(point));
    navigation.navigate('PointDetails', { pointId: point.id });
  };

  const filteredPoints = points.filter(
    (p) => p.projectId === projectId && p.floorId === (floorId || 'floor1')
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Floor Plan</Text>
        <Text style={styles.subtitle}>{filteredPoints.length} points</Text>
      </View>

      <InteractiveFloorPlan
        points={filteredPoints}
        onPointPress={handlePointPress}
        onAddPoint={handleAddPoint}
        editable={true}
      />

      {/* Add Point Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Point</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Point Number *</Text>
                <TextInput
                  style={styles.formInput}
                  value={pointForm.pointNumber}
                  onChangeText={(text) =>
                    setPointForm({ ...pointForm, pointNumber: text })
                  }
                  placeholder="e.g., P001"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Type *</Text>
                <View style={styles.typeButtons}>
                  {(['data', 'voice', 'video', 'power', 'fiber'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        pointForm.type === type && styles.typeButtonActive,
                      ]}
                      onPress={() => setPointForm({ ...pointForm, type })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          pointForm.type === type && styles.typeButtonTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Category *</Text>
                <View style={styles.typeButtons}>
                  {(['Cat5e', 'Cat6', 'Cat6a', 'Cat7', 'Fiber', 'Coax'] as const).map(
                    (category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          pointForm.category === category && styles.categoryButtonActive,
                        ]}
                        onPress={() => setPointForm({ ...pointForm, category })}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            pointForm.category === category &&
                              styles.categoryButtonTextActive,
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={pointForm.description}
                  onChangeText={(text) =>
                    setPointForm({ ...pointForm, description: text })
                  }
                  placeholder="Optional description"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSavePoint}
              >
                <Text style={styles.saveButtonText}>Save Point</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalForm: {
    padding: 20,
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default FloorPlanScreen;