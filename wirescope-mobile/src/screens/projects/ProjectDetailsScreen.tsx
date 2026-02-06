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
import { setCurrentProject } from '../../store/slices/projectsSlice';

interface Props {
  route: RouteProp<ProjectsStackParamList, 'ProjectDetails'>;
  navigation: NavigationProp<ProjectsStackParamList, 'ProjectDetails'>;
}

const ProjectDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  
  const { projects, currentProject } = useSelector((state: RootState) => state.projects);
  
  useEffect(() => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      dispatch(setCurrentProject(project));
    }
  }, [projectId, projects, dispatch]);

  if (!currentProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Project not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'planning':
        return '#FF9800';
      case 'completed':
        return '#2196F3';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const handleEditProject = () => {
    Alert.alert('Edit Project', 'Edit project functionality coming soon');
  };

  const handleDeleteProject = () => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete functionality
            Alert.alert('Success', 'Project deleted successfully');
            navigation.goBack();
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <Text style={styles.projectName}>{currentProject.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentProject.status) }]}>
              <Text style={styles.statusText}>{currentProject.status.toUpperCase()}</Text>
            </View>
          </View>
          
          {currentProject.description && (
            <Text style={styles.description}>{currentProject.description}</Text>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client:</Text>
            <Text style={styles.infoValue}>{currentProject.clientName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Site Address:</Text>
            <Text style={styles.infoValue}>{currentProject.siteAddress}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date:</Text>
            <Text style={styles.infoValue}>
              {new Date(currentProject.startDate).toLocaleDateString()}
            </Text>
          </View>
          
          {currentProject.endDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>End Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(currentProject.endDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>
              {new Date(currentProject.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('FloorPlan', { projectId: currentProject.id })}
          >
            <Text style={styles.actionButtonText}>View Floor Plans</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEditProject}
          >
            <Text style={styles.actionButtonText}>Edit Project</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteProject}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete Project</Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  actionsSection: {
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#F44336',
  },
});

export default ProjectDetailsScreen;