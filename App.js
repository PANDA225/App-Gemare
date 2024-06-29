import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './Login';
import Register from './Register';
import UserPage from './Screens/UserPage';
import TechPage from './Screens/TechPage';
import AdminPage from './Screens/AdminPage';
import CreateReportPage from './Screens/CreateReportPage';
import ViewReportsPage from './Screens/ViewReportsPage';
import ReportDetailsPage from './Screens/ReportDetailsPage';
import ViewReportsPageAdmin from './Screens/ViewReportsPageAdmin';
import ReportDetailsPageAdmin from './Screens/ReportDetailsPageAdmin';
import ViewReportsPageTech from './Screens/ViewReportsPageTech';
import ReportDetailsPageTech from './Screens/ReportDetailsPageTech';
import SettingsPage from './Screens/SettingsPage';
import UserListPage from './Screens/UserListPage';
import DasboardPage from './Screens/DashboardPage';
import MaintenancePage from './Screens/MaintenancePage';
import NotificationPage from './Screens/NotificationPage';
import NotificationPageAdmin from './Screens/NotificationPageAdmin';
const Stack = createNativeStackNavigator();
function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }}/>
            <Stack.Screen name="Register" component={Register} options={{ headerShown: false }}/>
            <Stack.Screen name="AdministradorPage" component={AdminPage} options={{ headerShown: false }}/>
            <Stack.Screen name="TecnicoPage" component={TechPage} options={{ headerShown: false }}/>
            <Stack.Screen name="UsuarioPage" component={UserPage} options={{ headerShown: false }}/>
            <Stack.Screen name="CreateReportPage" component={CreateReportPage} options={{ headerShown: false }} />
            <Stack.Screen name="ViewReportsPage" component={ViewReportsPage} options={{ headerShown: false }} />
            <Stack.Screen name="ReportDetailsPage" component={ReportDetailsPage} options={{ headerShown: false }} />
            <Stack.Screen name="ViewReportsPageAdmin" component={ViewReportsPageAdmin} options={{ headerShown: false }} />
            <Stack.Screen name="ReportDetailsPageAdmin" component={ReportDetailsPageAdmin} options={{ headerShown: false }} />
            <Stack.Screen name="ViewReportsPageTech" component={ViewReportsPageTech} options={{ headerShown: false }} />
            <Stack.Screen name="ReportDetailsPageTech" component={ReportDetailsPageTech} options={{ headerShown: false }} />
            <Stack.Screen name="SettingsPage" component={SettingsPage} options={{ headerShown: false }} />
            <Stack.Screen name="UserListPage" component={UserListPage} options={{ headerShown: false }} />
            <Stack.Screen name="DasboardPage" component={DasboardPage} options={{ headerShown: false }} />
            <Stack.Screen name="MaintenancePage" component={MaintenancePage} options={{ headerShown: false }} />
            <Stack.Screen name="NotificationPage" component={NotificationPage} options={{ headerShown: false }} />
            <Stack.Screen name="NotificationPageAdmin" component={NotificationPageAdmin} options={{ headerShown: false }} />
          
      </Stack.Navigator>
    </NavigationContainer>
  );}
export default App;