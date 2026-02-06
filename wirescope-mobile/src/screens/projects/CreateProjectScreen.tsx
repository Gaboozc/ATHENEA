import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

import { ProjectsStackParamList } from '../../navigation/MainNavigator';
import { AppDispatch } from '../../store';
import { Project, addProject } from '../../store/slices/projectsSlice';

interface Props {
  navigation: NavigationProp<ProjectsStackParamList, 'CreateProject'>;
}

const CreateProjectScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientName: '',
    siteAddress: '',
    startDate: '',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }

    if (!formData.clientName.trim()) {
      Alert.alert('Error', 'Client name is required');
      return;
    }

    if (!formData.siteAddress.trim()) {
      Alert.alert('Error', 'Site address is required');
      return;
    }

    setLoading(true);

    try {
      const newProject: Project = {
        id: `project_${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
        clientName: formData.clientName.trim(),
        siteAddress: formData.siteAddress.trim(),
        status: 'planning',
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        projectManagerId: 'current_user_id', // This should come from auth state
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      dispatch(addProject(newProject));
      Alert.alert('Success', 'Project created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Project</Text>
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Creating...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Project Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder="Enter project name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            placeholder="Enter project description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Client Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.clientName}
            onChangeText={(text) => handleInputChange('clientName', text)}
            placeholder="Enter client name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Site Address *</Text>
          <TextInput
            style={styles.input}
            value={formData.siteAddress}
            onChangeText={(text) => handleInputChange('siteAddress', text)}
            placeholder="Enter site address"
            placeholderTextColor="#999"
            multiline
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Start Date</Text>
          <TextInput
            style={styles.input}
            value={formData.startDate}
            onChangeText={(text) => handleInputChange('startDate', text)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    padding: 5,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  textArea: {
    height: 100,
    paddingTop: 15,
  },
});

export default CreateProjectScreen;