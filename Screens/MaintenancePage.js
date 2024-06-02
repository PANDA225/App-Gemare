import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, StatusBar, View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { db } from '../firebase-config';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
};

LocaleConfig.defaultLocale = 'es';

export default function MaintenancePage() {
  const navigation = useNavigation();
  const route = useRoute();
  const userEmail = route.params?.userEmail;
  const [equipment, setEquipment] = useState('');
  const [maintenanceDay, setMaintenanceDay] = useState(new Date().toISOString().split('T')[0]);
  const [maintenanceFrequency, setMaintenanceFrequency] = useState('1 día');
  const [maintenances, setMaintenances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMaintenanceDates, setSelectedMaintenanceDates] = useState({});
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);

  useEffect(() => {
    fetchMaintenances();
  }, []);

  const handleSave = async () => {
    if (equipment.trim() === '') {
      Alert.alert('Error', 'Por favor ingresa el nombre del equipo.', [{ text: 'OK', style: 'destructive' }]);
      return;
    }
    setIsLoading(true);
    const data = {
      equipment,
      startDate: maintenanceDay,
      frequency: maintenanceFrequency,
      technicianEmail: userEmail,
    };
    try {
      const docRef = await addDoc(collection(db, 'maintenance'), data);
      const newMaintenance = { id: docRef.id, ...data };
      setMaintenances([newMaintenance, ...maintenances]);
      alert('Guardado con éxito');
      setEquipment('');
      setMaintenanceDay(new Date().toISOString().split('T')[0]);
      setMaintenanceFrequency('1 día');
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaintenances = async () => {
    setIsLoading(true);
    try {
      const db = getFirestore();
      const q = query(collection(db, "maintenance"), where("technicianEmail", "==", userEmail));
      const querySnapshot = await getDocs(q);
      const fetchedMaintenances = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaintenances(fetchedMaintenances);
    } catch (error) {
      console.error("Error fetching documents: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMaintenanceDates = (maintenance) => {
    let dates = {};
    let currentDate = new Date(maintenance.startDate);
    const frequencyInDays = parseInt(maintenance.frequency.split(' ')[0]);
    for (let i = 0; i < 10; i++) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dates[dateKey] = { selected: true, selectedColor: '#50cebb', selectedTextColor: '#ffffff' };
      currentDate.setDate(currentDate.getDate() + frequencyInDays);
    }
    return dates;
  };

  const handleSelectMaintenance = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setSelectedMaintenanceDates(calculateMaintenanceDates(maintenance));
  };

  const confirmDelete = (maintenanceId) => {
    handleDelete(maintenanceId);
  };

  const handleDelete = async (maintenanceId) => {
    try {
      await deleteDoc(doc(db, "maintenance", maintenanceId));
      const updatedMaintenances = maintenances.filter(maintenance => maintenance.id !== maintenanceId);
      setMaintenances(updatedMaintenances);
      alert('Mantenimiento eliminado con éxito.');
    } catch (error) {
      console.error("Error al eliminar el documento: ", error);
      alert('Error al eliminar el mantenimiento.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Image source={require('../assets/back_icon.png')} style={styles.backIcon} />
      </TouchableOpacity>
      <Text style={styles.header}>Agendar Mantenimiento</Text>
      <Calendar
        current={maintenanceDay}
        style={styles.calendarStyle}
        markedDates={selectedMaintenanceDates}
        onDayPress={(day) => {
          const newSelectedDates = { [day.dateString]: { selected: true, selectedColor: 'red', selectedTextColor: '#ffffff' } };
          setMaintenanceDay(day.dateString);
          setSelectedMaintenanceDates(newSelectedDates);
        }}
        theme={{ arrowColor: '#154F3A', monthTextColor: '#154F3A', textMonthFontWeight: 'bold', textMonthFontSize: 28, todayBackgroundColor: '#154F3A', todayTextColor: '#FFFFFF' }}
        locale="es"
      />
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre del Equipo</Text>
        <TextInput placeholder="Introduce el nombre del equipo" value={equipment} onChangeText={(text) => { setEquipment(text); }} style={styles.input} />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Frecuencia de Mantenimiento</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={maintenanceFrequency} onValueChange={(itemValue) => setMaintenanceFrequency(itemValue)} style={styles.picker}>
            <Picker.Item label="Cada día" value="1 día" />
            <Picker.Item label="Cada 3 días" value="3 días" />
            <Picker.Item label="Cada semana" value="7 días" />
            <Picker.Item label="Cada mes" value="30 días" />
            <Picker.Item label="Cada 3 meses" value="90 días" />
            <Picker.Item label="Cada 6 meses" value="180 días" />
          </Picker>
        </View>
      </View>
      <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isLoading}>
        <Text style={styles.saveButtonText}>Guardar</Text>
      </TouchableOpacity>
      {isLoading ? (
        <ActivityIndicator size="large" color="#154F3A" />
      ) : (
        maintenances.map((maintenance, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.maintenanceItem, selectedMaintenance && selectedMaintenance.id === maintenance.id ? styles.selectedItem : null]}
            onPress={() => handleSelectMaintenance(maintenance)}
          >
            <View style={styles.itemHeader}>
              <Text style={[styles.itemHeaderText, selectedMaintenance && selectedMaintenance.id === maintenance.id ? styles.selectedItemText : null]}>Equipo: {maintenance.equipment}</Text>
              <TouchableOpacity onPress={() => confirmDelete(maintenance.id)} style={styles.deleteButton}>
                <Icon name="delete" size={24} color="red" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.maintenanceText, selectedMaintenance && selectedMaintenance.id === maintenance.id ? styles.selectedItemText : null]}>Fecha de inicio: {maintenance.startDate}</Text>
            <Text style={[styles.maintenanceText, selectedMaintenance && selectedMaintenance.id === maintenance.id ? styles.selectedItemText : null]}>Frecuencia: {maintenance.frequency}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FFFFFF' },
  backButton: { marginLeft: 1, marginTop: 20, zIndex: 10 },
  backIcon: { marginTop: 20, marginLeft: 10, width: 24, height: 18 },
  header: { fontSize: 35, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#154F3A' },
  inputContainer: { marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, fontSize: 16, borderRadius: 5 },
  maintenanceItem: { padding: 10, marginTop: 10, borderRadius: 5, borderWidth: 1, borderColor: '#ccc' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemHeaderText: { fontSize: 18, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#154F3A', padding: 10, borderRadius: 5, alignItems: 'center', justifyContent: 'center', height: 50, width: '100%' },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  deleteButton: { padding: 6, borderRadius: 5 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#154F3A' },
  pickerContainer: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  picker: { width: '100%' },
  selectedItem: { backgroundColor: '#154F3A', borderWidth: 2, borderRadius: 5, borderColor: '#fff' },
  calendarStyle: { borderColor: '#ccc', borderWidth: 1, marginBottom: 30, borderRadius: 5 },
  maintenanceText: { fontSize: 16, marginBottom: 5 },
  selectedItemText: { color: '#FFFFFF' },
});