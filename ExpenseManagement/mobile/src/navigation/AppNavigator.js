import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { canCreateExpenseType, canApproveExpenseType, canApproveReimbursement } from '../constants/roles';

import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ExpenseTypeListScreen from '../screens/expense-types/ExpenseTypeListScreen';
import CreateExpenseTypeScreen from '../screens/expense-types/CreateExpenseTypeScreen';
import ExpenseTypeDetailScreen from '../screens/expense-types/ExpenseTypeDetailScreen';
import ReimbursementListScreen from '../screens/reimbursements/ReimbursementListScreen';
import CreateReimbursementScreen from '../screens/reimbursements/CreateReimbursementScreen';
import ReimbursementDetailScreen from '../screens/reimbursements/ReimbursementDetailScreen';
import PendingApprovalsScreen from '../screens/approvals/PendingApprovalsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import LoadingOverlay from '../components/common/LoadingOverlay';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: COLORS.primary, elevation: 0, shadowOpacity: 0 },
  headerTintColor: COLORS.white,
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
  cardStyle: { backgroundColor: COLORS.background },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="ExpenseTypeDetail" component={ExpenseTypeDetailScreen} options={{ title: 'Expense Type Details' }} />
      <Stack.Screen name="ReimbursementDetail" component={ReimbursementDetailScreen} options={{ title: 'Reimbursement Details' }} />
    </Stack.Navigator>
  );
}

function ExpenseTypesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ExpenseTypesList" component={ExpenseTypeListScreen} options={{ title: 'Expense Types' }} />
      <Stack.Screen name="CreateExpenseType" component={CreateExpenseTypeScreen} options={{ title: 'New Expense Type' }} />
      <Stack.Screen name="ExpenseTypeDetail" component={ExpenseTypeDetailScreen} options={{ title: 'Expense Type Details' }} />
    </Stack.Navigator>
  );
}

function ReimbursementsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ReimbursementsList" component={ReimbursementListScreen} options={{ title: 'My Claims' }} />
      <Stack.Screen name="CreateReimbursement" component={CreateReimbursementScreen} options={{ title: 'New Claim' }} />
      <Stack.Screen name="ReimbursementDetail" component={ReimbursementDetailScreen} options={{ title: 'Claim Details' }} />
    </Stack.Navigator>
  );
}

function ApprovalsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PendingApprovals" component={PendingApprovalsScreen} options={{ title: 'Pending Approvals' }} />
      <Stack.Screen name="ExpenseTypeDetail" component={ExpenseTypeDetailScreen} options={{ title: 'Expense Type Details' }} />
      <Stack.Screen name="ReimbursementDetail" component={ReimbursementDetailScreen} options={{ title: 'Claim Details' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="ExpenseTypes" component={ExpenseTypeListScreen} options={{ title: 'Expense Types' }} />
      <Stack.Screen name="Reimbursements" component={ReimbursementListScreen} options={{ title: 'My Claims' }} />
      <Stack.Screen name="ExpenseTypeDetail" component={ExpenseTypeDetailScreen} options={{ title: 'Expense Type Details' }} />
      <Stack.Screen name="ReimbursementDetail" component={ReimbursementDetailScreen} options={{ title: 'Claim Details' }} />
    </Stack.Navigator>
  );
}

function MainTabs({ user }) {
  const showApprovals = canApproveExpenseType(user?.role) || canApproveReimbursement(user?.role);
  const showExpenseTypes = true;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      {showExpenseTypes && (
        <Tab.Screen
          name="ExpenseTypes"
          component={ExpenseTypesStack}
          options={{
            tabBarLabel: 'Budgets',
            tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline" size={size} color={color} />,
          }}
        />
      )}
      <Tab.Screen
        name="Reimbursements"
        component={ReimbursementsStack}
        options={{
          tabBarLabel: 'Claims',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
        }}
      />
      {showApprovals && (
        <Tab.Screen
          name="Approvals"
          component={ApprovalsStack}
          options={{
            tabBarLabel: 'Approvals',
            tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-done-outline" size={size} color={color} />,
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingOverlay fullScreen />;

  return (
    <NavigationContainer>
      {user ? <MainTabs user={user} /> : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
