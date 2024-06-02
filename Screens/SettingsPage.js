import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, StatusBar, ScrollView, TextInput, Alert } from 'react-native';
import { addDoc, collection, getFirestore, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


export default function SettingsPage({ navigation }) {
  const [newArea, setNewArea] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const db = getFirestore();
      const areasSnapshot = await getDocs(query(collection(db, 'areas'), orderBy('area')));
      const fetchedAreas = [];
      areasSnapshot.forEach(doc => {
        fetchedAreas.push({ id: doc.id, name: doc.data().area });
      });
      setAreas(fetchedAreas);
      if (fetchedAreas.length > 0) {
        setSelectedArea(fetchedAreas[0].id);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const handleAddArea = async () => {
    if (!newArea) {
      Alert.alert('Error', 'Por favor ingresa el nombre del área.');
      return;
    }

    try {
      const db = getFirestore();
      await addDoc(collection(db, 'areas'), { area: newArea });
      setNewArea('');
      fetchAreas();
      Alert.alert('Éxito', 'El área se ha añadido correctamente.');
    } catch (error) {
      console.error('Error al agregar el área:', error);
      Alert.alert('Error', 'No se pudo agregar el área.');
    }
  };


  const handleDeleteArea = async () => {
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'areas', selectedArea));
      fetchAreas();
      Alert.alert('Éxito', 'El área se ha eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar el área:', error);
      Alert.alert('Error', 'No se pudo eliminar el área.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
  <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
  <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
    <Image source={require('../assets/back_icon.png')} style={styles.backIcon} />
  </TouchableOpacity>
  <Text style={styles.header}>Ajustes</Text>
  <Text style={styles.label}>Áreas</Text>
  <View style={styles.pickerDeleteContainer}>
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={selectedArea}
        onValueChange={(itemValue) => setSelectedArea(itemValue)}
        style={styles.picker}
      >
        {areas.map((area, index) => (
          <Picker.Item key={index} label={area.name} value={area.id} />
        ))}
      </Picker>
    </View>
    <TouchableOpacity onPress={handleDeleteArea} style={styles.deleteButton}>
    <Image
    source={require('../assets/delete.png')}
    style={styles.deleteIcon}
  />
    </TouchableOpacity>
  </View>

  <View style={styles.inputWithButton}>
  <TextInput
    placeholder="Nueva Área"
    value={newArea}
    onChangeText={setNewArea}
    style={[styles.input, { flex: 1, marginRight: 10 }]}
  />
  <TouchableOpacity onPress={handleAddArea} style={styles.addButton}>
    <MaterialIcons name="add" size={24} color="#fff" />
  </TouchableOpacity>
</View>
  
  <Text style={styles.label}>Usuarios</Text>
<TouchableOpacity onPress={() => navigation.navigate('UserListPage')} style={styles.addButton}>
          <Text style={styles.buttonText}>Lista de Usuarios</Text>
        </TouchableOpacity>
</View>

    </ScrollView>
    
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: '#FFFFFF',
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
    input: {
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 5,
      padding: 10,
    },
    addButton: {
      backgroundColor: '#154F3A',
      padding: 15,
      borderRadius: 5,
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    label: {
      borderTopWidth: 1,
      paddingTop: 20,
      borderColor: 'gray',
      fontSize: 26,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom:20,
    },
    pickerDeleteContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    pickerContainer: {
      flex: 1,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 5,
    },
    picker: {
      flex: 1,
    },
    deleteButton: {
      marginLeft: 10,
      backgroundColor: 'red',
      padding: 10,
      borderRadius: 5,
    },
    deleteButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    deleteIcon: {
        width: 30, // Ajusta el ancho según tus necesidades
        height: 30, // Ajusta la altura según tus necesidades
      },
      inputWithButton: {
        flexDirection: 'row', // Coloca el input y el botón uno al lado del otro
        alignItems: 'center', // Alinea verticalmente
        marginBottom: 20,
      },
      addButton: {
        // Ajusta estos estilos si es necesario, pero asegúrate de que el botón tenga suficiente padding y sea fácil de tocar
        padding: 12,
        borderRadius: 5,
        backgroundColor: '#154F3A', // O cualquier color que desees
      },
      addIcon: {
        width: 30, // Ajusta según la apariencia deseada
        height: 30, // Ajusta según la apariencia deseada
      },
  });