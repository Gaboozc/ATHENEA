import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Chip from '../ui/Chip';

interface Point {
  id: string;
  pointNumber: string;
  type: 'data' | 'voice' | 'video' | 'power' | 'fiber';
  category: 'Cat5e' | 'Cat6' | 'Cat6a' | 'Cat7' | 'Fiber' | 'Coax';
  status: 'planned' | 'installed' | 'tested' | 'certified' | 'failed';
  roomNumber?: string;
  description?: string;
  coordinates: {
    x: number;
    y: number;
  };
}

interface PointCardProps {
  point: Point;
  onPress: (point: Point) => void;
  onStatusChange?: (point: Point, newStatus: Point['status']) => void;
  showLocation?: boolean;
}

const PointCard: React.FC<PointCardProps> = ({
  point,
  onPress,
  onStatusChange,
  showLocation = true,
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'data':
        return '#2196F3';
      case 'voice':
        return '#4CAF50';
      case 'video':
        return '#FF9800';
      case 'power':
        return '#F44336';
      case 'fiber':
        return '#9C27B0';
      default:
        return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'secondary';
      case 'installed':
        return 'warning';
      case 'tested':
        return 'info';
      case 'certified':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Card
      onPress={() => onPress(point)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.pointInfo}>
          <View style={styles.pointNumberContainer}>
            <View 
              style={[
                styles.typeIndicator, 
                { backgroundColor: getTypeColor(point.type) }
              ]} 
            />
            <Text style={styles.pointNumber}>{point.pointNumber}</Text>
          </View>
          
          <View style={styles.categoryRow}>
            <Text style={styles.category}>{point.category}</Text>
            <Text style={styles.type}>{point.type.toUpperCase()}</Text>
          </View>
        </View>

        <Chip
          label={getStatusLabel(point.status)}
          color={getStatusColor(point.status) as any}
          variant="filled"
          size="small"
          onPress={onStatusChange ? () => {
            // Cycle through statuses for quick updates
            const statuses: Point['status'][] = ['planned', 'installed', 'tested', 'certified'];
            const currentIndex = statuses.indexOf(point.status);
            const nextStatus = statuses[(currentIndex + 1) % statuses.length];
            onStatusChange(point, nextStatus);
          } : undefined}
        />
      </View>

      {point.description && (
        <Text style={styles.description} numberOfLines={2}>
          {point.description}
        </Text>
      )}

      {showLocation && (
        <View style={styles.locationRow}>
          {point.roomNumber && (
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>Room:</Text>
              <Text style={styles.locationValue}>{point.roomNumber}</Text>
            </View>
          )}
          
          <View style={styles.locationItem}>
            <Text style={styles.locationLabel}>Position:</Text>
            <Text style={styles.locationValue}>
              X: {point.coordinates.x.toFixed(1)}, Y: {point.coordinates.y.toFixed(1)}
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pointInfo: {
    flex: 1,
    marginRight: 12,
  },
  pointNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  pointNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginRight: 8,
  },
  type: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  locationValue: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default PointCard;