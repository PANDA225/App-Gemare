import React, { useState, useEffect } from 'react';
import { StatusBar, TouchableOpacity, View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableHighlight, TextInput } from 'react-native';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Componente para visualizar reportes
const ViewReportsPageAdmin = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState(new Date());
  const [dateTitle, setDateTitle] = useState('Fecha y Hora');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = fetchReports();
    return unsubscribe;
  }, [dateTitle, date]);

  const handleDatePickerButtonPress = () => setShowDatePicker(!showDatePicker);

  const fetchReports = () => {
    const db = getFirestore();
    const query = collection(db, 'reports');

    // Suscripción en tiempo real para escuchar los cambios en la colección 'reports'
    const unsubscribe = onSnapshot(query, (snapshot) => {
      let fetchedReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(report => (!searchQuery || report.folio.toString().includes(searchQuery)) && (dateTitle === 'Fecha y Hora' || report.date === formatDate(date)));
      setReports(fetchedReports);
      setIsLoading(false);
    });

    return unsubscribe;
  };

  const formatDate = (date) => `${('0' + date.getDate()).slice(-2)}/${('0' + (date.getMonth() + 1)).slice(-2)}/${date.getFullYear()}`;

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
    setDateTitle(formatDate(currentDate));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pendiente': return 'red';
      case 'en proceso': return 'orange';
      case 'completado': return 'green';
      default: return 'grey';
    }
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDate(new Date());
    setDateTitle('Fecha y Hora');
    setIsLoading(true); // Actualiza el estado de isLoading para mostrar el indicador de carga
    fetchReports();
  };

  if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#154F3A" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
    <Image source={require('../assets/back_icon.png')} style={styles.backIcon} />
  </TouchableOpacity>
  <Text style={styles.header}>Reportes Enviados</Text>
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="Buscar por folio" onChangeText={setSearchQuery} value={searchQuery} />
        <TouchableOpacity onPress={fetchReports} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}><Text style={styles.refreshButtonText}>Borrar Filtros</Text></TouchableOpacity>
      <View style={styles.reportHeaders}>
        <Text style={styles.headerText}>Folio</Text>
        <TouchableOpacity onPress={handleDatePickerButtonPress} style={styles.datePickerButton}><Text style={styles.headerText}>{dateTitle}</Text></TouchableOpacity>
        {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />}
        <Text style={styles.headerText}>Estado</Text>
      </View>
      <ScrollView style={styles.reportsContainer}>
        {reports.map((report) => (
          <TouchableHighlight key={report.id} style={styles.reportItem} underlayColor="#DDDDDD" onPress={() => navigation.navigate('ReportDetailsPageAdmin', { report })}>
            <View style={styles.reportRow}>
              <View style={[styles.statusCircle, { backgroundColor: getStatusColor(report.status) }]} />
              <Text style={styles.reportColumnText}>{report.folio}</Text>
              <Text style={styles.reportColumnText}>{report.date} - {report.time}</Text>
              <Text style={[styles.reportColumnText, {color: getStatusColor(report.status)}]}>{report.status}</Text>
            </View>
          </TouchableHighlight>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 25, 
    backgroundColor: '#FFFFFF' 
  },
  header: {
    fontSize: 35,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#154F3A',
  },
  backButton: {
    marginLeft: 1,
    marginTop: 20,
    zIndex: 10,
  },
  backIcon: {
    marginTop: 20,
    marginLeft: 10,
    width: 24,
    height: 18,
  },
  title: { 
    flex: 1, 
    fontSize: 35, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    color: '#154F3A', 
    marginTop: 40, 
    marginBottom: 20 
  },
  reportsContainer: { 
    flex: 1 
  },
  reportItem: { 
    padding: 15, 
    marginBottom: 10, 
    borderRadius: 5, 
    borderBottomWidth: 1, 
    borderColor:'#D3CECE' 
  },
  reportRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  reportColumnText: { 
    fontWeight:'bold', 
    fontSize:14, 
    flex: 1, 
    textAlign: 'center' 
  },
  statusCircle: {
    width: 15,
    height: 15,
    borderRadius: 100,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  searchInput: { 
    borderColor: 'gray', 
    borderWidth: 1, 
    borderRadius: 5, 
    padding: 10, 
    flex: 1 
  },
  searchButton: { 
    backgroundColor: '#154F3A', 
    padding: 10, 
    borderRadius: 5, 
    marginLeft: 10 
  },
  searchButtonText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF' 
  },
  reportHeaders: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingLeft: 20 
  },
  headerText: { 
    fontSize:20, 
    fontWeight: 'bold', 
    flex: 1, 
    textAlign: 'center', 
    paddingBottom:5, 
    borderBottomWidth:2 
  },
  refreshButton: { 
    backgroundColor: '#FF0000', 
    padding: 10, 
    borderRadius: 5, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  refreshButtonText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
});

export default ViewReportsPageAdmin;
