import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';

import { ProjectsStackParamList } from '../../navigation/MainNavigator';
import { ScreenWrapper, Header, Button, ProjectCard, FilterBar } from '../../components';
import { RootState, AppDispatch } from '../../store';
import { Project, setProjects, setLoading } from '../../store/slices/projectsSlice';

interface Props {
  navigation: NavigationProp<ProjectsStackParamList, 'ProjectsList'>;
}

const ProjectsListScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, loading, error } = useSelector((state: RootState) => state.projects);

  // Mock data for development
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Office Building A',
      status: 'active',
      clientName: 'ABC Corporation',
      siteAddress: '123 Business District',
      projectManagerId: 'pm1',
      description: 'Complete electrical installation for new office building',
      startDate: '2024-01-15',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
    },
    {
      id: '2',
      name: 'Warehouse Data Center',
      status: 'planning',
      clientName: 'XYZ Logistics',
      siteAddress: '456 Industrial Ave',
      projectManagerId: 'pm2',
      description: 'Network infrastructure for new data center',
      startDate: '2024-02-01',
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    },
    {
      id: '3',
      name: 'Hospital Network',
      status: 'completed',
      clientName: 'City Medical Center',
      siteAddress: '789 Health Street',
      projectManagerId: 'pm1',
      description: 'Hospital-wide network upgrade',
      startDate: '2023-10-01',
      endDate: '2024-01-01',
      createdAt: '2023-09-15T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
  ];

  useEffect(() => {
    // Load projects on component mount
    dispatch(setLoading(true));
    // Simulate API call delay
    setTimeout(() => {
      dispatch(setProjects(mockProjects));
    }, 1000);
  }, [dispatch]);

  const getCompletion = (project: Project): number => {
    // Calculate completion percentage based on status
    switch (project.status) {
      case 'completed':
        return 100;
      case 'active':
        return 75; // Mock percentage
      case 'planning':
        return 25; // Mock percentage
      default:
        return 0;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'planning':
        return '#FF9800';
      case 'completed':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const renderProject = ({ item }: { item: Project }) => {
    const completion = getCompletion(item);
    return (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
    >
      <View style={styles.projectHeader}>
        <Text style={styles.projectName}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.clientName}>{item.clientName}</Text>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Completion: {completion}%</Text>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${completion}%` }]} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateProject')}
        >
          <Text style={styles.addButtonText}>+ Add Project</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => {
          dispatch(setLoading(true));
          setTimeout(() => {
            dispatch(setProjects(mockProjects));
          }, 1000);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  clientName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default ProjectsListScreen;