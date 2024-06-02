import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, Image, BackHandler } from 'react-native';
import { FAB } from 'react-native-paper';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config'; // Asumiendo que tienes acceso a Firebase Auth aquí
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { getFirestore, collection, onSnapshot, query, where } from 'firebase/firestore';

export default function TechPage({ navigation, route }) {
  const [state, setState] = useState({ open: false });
  const { userEmail } = route.params; // Asegúrate de recibir el correo aquí
  const { technicianName  } = route.params;
  const [hasNotifications, setHasNotifications] = useState(false);
  // Manejo del estado del FAB (Floating Action Button)
  const onStateChange = ({ open }) => setState({ open });
  const { open } = state;

  // Función para cerrar sesión
  const handleSignOut = () => {
    signOut(auth).then(() => {
      navigation.navigate('Login');
    }).catch((error) => {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión correctamente.');
    });
  };
  useEffect(() => {
    const db = getFirestore();
    const q = query(collection(db, 'reports'), where('technicianEmail', '==', userEmail),where('notificationTech', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasNotifications(!snapshot.empty);
    });

    // Devolvemos una función de limpieza para cancelar la suscripción cuando el componente se desmonte
    return () => unsubscribe();
  }, []);
  // Prevención de la acción de retorno a la página anterior
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerText}>¡Bienvenido, {technicianName}!</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('MaintenancePage', { userEmail: userEmail })} style={styles.buttonWithLabel}>
            <Image source={require('../assets/view_date_icon.png')} style={[styles.buttonImage, { tintColor: '#154F3A' }]} />
            <Text style={styles.buttonLabel}>Agendar Mantenimiento</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate('ViewReportsPageTech', { userEmail: userEmail })} style={styles.buttonWithLabel}>
              <Image source={require('../assets/view_report_icon.png')} style={[styles.buttonImage, { tintColor: '#154F3A' }]} />
              <Text style={styles.buttonLabel}>Ver Reportes</Text>
          </TouchableOpacity>


        </View>
        <FAB.Group
        open={open}
        icon={hasNotifications ? 'bell-ring' : (open ? 'close' : 'plus')}
        color="#FFFFFF"
        backdropColor='#00000000'
        fabStyle={[styles.fab, hasNotifications && styles.fabActive]}
        actions={[
          { 
  icon: hasNotifications ? 'bell-ring' : 'bell', 
  label: `Notificaciones (${hasNotifications ? '1+' : '0'})`, 
  onPress: () => {navigation.navigate('NotificationPage', { userEmail: userEmail })}, 
  color: '#FFFFFF', 
  style: { 
    backgroundColor: hasNotifications ? 'blue' : '#000000', // Cambio de color a azul si hay notificaciones
    marginTop: -20 
  }, 
  labelStyle: [styles.fabLabel, hasNotifications ? styles.notificationLabel : null] 
},
          { icon: 'logout', label: 'Cerrar Sesión', onPress: handleSignOut, color: '#FFFFFF', style: { backgroundColor: 'red', marginTop: -20}, labelStyle: styles.fabLabel },
        ]}
        onStateChange={onStateChange}
        style={{ position: 'absolute', right: 16, bottom: 16 }}
        theme={{ colors: { accent: '#154F3A', primary: '#154F3A', backdrop: 'transparent' } }}
      >
      </FAB.Group>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginTop:35,
    backgroundColor: '#FFFFFF',
    padding: 10,
    paddingTop: 20,
  },
  headerText: {
    textAlign:'center',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#154F3A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  fab: {
    backgroundColor: '#154F3A',
  },
  fabLabel: {
    fontWeight: 'bold',
    borderWidth: 1,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginTop: -20,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  buttonWithLabel: {
    width: 200,
    marginBottom: 30,
    alignItems: 'center',
    borderColor: '#154F3A',
    borderWidth: 2,
    padding: 15,
    borderRadius: 30,
    alignContent: 'center',
  },
  buttonImage: {
    width: 150,
    height: 150,
  },
  buttonLabel: {
    textAlign:'center',
    margin: 10,
    color: '#154F3A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationLabel: {
    color: 'blue', // Cambiar a color rojo cuando hay notificaciones activas
  },
  fabActive: {
    backgroundColor: 'blue', // Color rojo cuando hay notificaciones activas
  },
});