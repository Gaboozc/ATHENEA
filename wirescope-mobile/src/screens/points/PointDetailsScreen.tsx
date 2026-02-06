import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, NavigationProp } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';

import { ProjectsStackParamList } from '../../navigation/MainNavigator';
import { RootState, AppDispatch } from '../../store';
import { setSelectedPoint, updatePoint, deletePoint } from '../../store/slices/pointsSlice';

interface Props {
  route: RouteProp<ProjectsStackParamList, 'PointDetails'>;
  navigation: NavigationProp<ProjectsStackParamList, 'PointDetails'>;
}

const PointDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { pointId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { points, selectedPoint } = useSelector((state: RootState) => state.points);

  useEffect(() => {
    const point = points.find((p) => p.id === pointId);
    if (point) {
      dispatch(setSelectedPoint(point));
    }
  }, [pointId, points, dispatch]);

  if (!selectedPoint) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Point not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'data':
        return '#2196F3';
      case 'voice':
        return '#4CAF50';
      case 'video':
        return '#9C27B0';
      case 'power':
        return '#FF9800';
      case 'fiber':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'planned':
        return '#9E9E9E';
      case 'installed':
        return '#4CAF50';
      case 'tested':
        return '#2196F3';
      case 'certified':
        return '#9C27B0';
      case 'failed':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const handleUpdateStatus = (newStatus: typeof selectedPoint.status) => {
    const updatedPoint = {
      ...selectedPoint,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    dispatch(updatePoint(updatedPoint));
    Alert.alert('Success', 'Point status updated');
  };

  const handleDeletePoint = () => {
    Alert.alert(
      'Delete Point',
      'Are you sure you want to delete this point?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deletePoint(selectedPoint.id));
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.pointNumberRow}>
            <Text style={styles.pointNumber}>{selectedPoint.pointNumber}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(selectedPoint.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {selectedPoint.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.typeRow}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: getTypeColor(selectedPoint.type) },
              ]}
            >
              <Text style={styles.typeBadgeText}>
                {selectedPoint.type.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.categoryText}>{selectedPoint.category}</Text>
          </View>

          {selectedPoint.description && (
            <Text style={styles.description}>{selectedPoint.description}</Text>
          )}
        </View>

        {/* Location Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Coordinates:</Text>
            <Text style={styles.infoValue}>
              X: {selectedPoint.coordinates.x.toFixed(0)}, Y:{' '}
              {selectedPoint.coordinates.y.toFixed(0)}
            </Text>
          </View>
          {selectedPoint.roomId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Room:</Text>
              <Text style={styles.infoValue}>{selectedPoint.roomId}</Text>
            </View>
          )}
        </View>

        {/* Status Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusButtons}>
            {(['planned', 'installed', 'tested', 'certified', 'failed'] as const).map(
              (status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    selectedPoint.status === status && styles.statusButtonActive,
                    { borderColor: getStatusColor(status) },
                  ]}
                  onPress={() => handleUpdateStatus(status)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      selectedPoint.status === status && {
                        color: getStatusColor(status),
                        fontWeight: 'bold',
                      },
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* Test Results (if available) */}
        {selectedPoint.testResults && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <Text style={styles.infoValue}>
              {JSON.stringify(selectedPoint.testResults, null, 2)}
            </Text>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Metadata</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>
              {new Date(selectedPoint.createdAt).toLocaleString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Updated:</Text>
            <Text style={styles.infoValue}>
              {new Date(selectedPoint.updatedAt).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeletePoint}
        >
          <Text style={styles.deleteButtonText}>Delete Point</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  headerSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pointNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  actionsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  statusButtonActive: {
    backgroundColor: '#f8f8f8',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F44336',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PointDetailsScreen;