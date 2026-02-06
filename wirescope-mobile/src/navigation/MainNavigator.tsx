import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import DashboardScreen from '../screens/main/DashboardScreen';
import ProjectsListScreen from '../screens/projects/ProjectsListScreen';
import ProjectDetailsScreen from '../screens/projects/ProjectDetailsScreen';
import CreateProjectScreen from '../screens/projects/CreateProjectScreen';
import FloorPlanScreen from '../screens/floorplan/FloorPlanScreen';
import PointDetailsScreen from '../screens/points/PointDetailsScreen';
import MaterialsScreen from '../screens/materials/MaterialsScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  Projects: undefined;
  FloorPlan: undefined;
  Materials: undefined;
  Settings: undefined;
};

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetails: { projectId: string };
  CreateProject: undefined;
  FloorPlan: { projectId: string; floorId?: string };
  PointDetails: { pointId: string };
};

export type MaterialsStackParamList = {
  MaterialsList: undefined;
  MaterialDetails: { materialId: string };
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Profile: undefined;
  Reports: undefined;
  Support: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const ProjectsStack = createNativeStackNavigator<ProjectsStackParamList>();
const MaterialsStack = createNativeStackNavigator<MaterialsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

// Stack Navigators
const ProjectsNavigator: React.FC = () => {
  return (
    <ProjectsStack.Navigator>
      <ProjectsStack.Screen 
        name="ProjectsList" 
        component={ProjectsListScreen}
        options={{ title: 'Projects' }}
      />
      <ProjectsStack.Screen 
        name="CreateProject" 
        component={CreateProjectScreen}
        options={{ 
          title: 'New Project',
          presentation: 'modal',
        }}
      />
      <ProjectsStack.Screen 
        name="ProjectDetails" 
        component={ProjectDetailsScreen}
        options={{ title: 'Project Details' }}
      />
      <ProjectsStack.Screen 
        name="FloorPlan" 
        component={FloorPlanScreen}
        options={{ title: 'Floor Plan' }}
      />
      <ProjectsStack.Screen 
        name="PointDetails" 
        component={PointDetailsScreen}
        options={{ title: 'Point Details' }}
      />
    </ProjectsStack.Navigator>
  );
};

const MaterialsNavigator: React.FC = () => {
  return (
    <MaterialsStack.Navigator>
      <MaterialsStack.Screen 
        name="MaterialsList" 
        component={MaterialsScreen}
        options={{ title: 'Materials' }}
      />
    </MaterialsStack.Navigator>
  );
};

const SettingsNavigator: React.FC = () => {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen 
        name="SettingsMain" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
    </SettingsStack.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Projects':
              iconName = 'work';
              break;
            case 'FloorPlan':
              iconName = 'architecture';
              break;
            case 'Materials':
              iconName = 'inventory';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Projects" component={ProjectsNavigator} />
      <Tab.Screen name="FloorPlan" component={FloorPlanScreen} />
      <Tab.Screen name="Materials" component={MaterialsNavigator} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
};

export default MainNavigator;