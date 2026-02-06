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

interface Project {
  id: string;
  name: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  clientName: string;
  completion: number;
  totalPoints: number;
  lastActivity: string;
}

interface ProjectCardProps {
  project: Project;
  onPress: (project: Project) => void;
  onStatusPress?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onPress,
  onStatusPress,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'planning':
        return 'warning';
      case 'completed':
        return 'primary';
      case 'cancelled':
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
      onPress={() => onPress(project)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.projectName} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={styles.clientName} numberOfLines={1}>
            {project.clientName}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          <Chip
            label={getStatusLabel(project.status)}
            color={getStatusColor(project.status) as any}
            variant="filled"
            size="small"
            onPress={onStatusPress ? () => onStatusPress(project) : undefined}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{project.totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={styles.statValue}>{project.completion}%</Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Progress</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${project.completion}%`,
                  backgroundColor: project.completion === 100 ? '#4CAF50' : '#2196F3'
                }
              ]} 
            />
          </View>
        </View>
      </View>

      <Text style={styles.lastActivity}>
        Last updated: {project.lastActivity}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
    marginRight: 24,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  progressContainer: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  lastActivity: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ProjectCard;