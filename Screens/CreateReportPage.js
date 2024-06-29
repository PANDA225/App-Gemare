import React, { useCallback, useState, useEffect } from "react";
import {
  Modal,
  StatusBar,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";

export default function CreateReportPage() {
  const navigation = useNavigation();
  const storage = getStorage();
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [computerData, setDatosDelEquipo] = useState("");
  const [servicePerformed, setServicioARealizar] = useState("");
  const [no_card, setNoCard] = useState("");
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  const validateForm = () => {
    let newErrors = {};
    if (!computerData) newErrors.computerData = true;
    if (!servicePerformed) newErrors.servicePerformed = true;
    if (!no_card) newErrors.no_card = true;
    if (!selectedArea) newErrors.selectedArea = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const [modalVisible, setModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };
  const images = [
    {
      url: selectedImage,
    },
  ];

  useEffect(() => {
    const fetchAreas = async () => {
      const db = getFirestore();
      const querySnapshot = await getDocs(collection(db, "areas"));
      const fetchedAreas = [];
      querySnapshot.forEach((doc) => {
        fetchedAreas.push(doc.data());
      });
      setAreas(fetchedAreas);
      if (fetchedAreas.length > 0) {
        setSelectedArea(fetchedAreas[0].area);
      }
    };
    fetchAreas();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
      setCurrentTime(
        now.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    }, [])
  );

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("¡Lo sentimos, necesitamos los permisos necesarios!");
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.cancelled) {
        setSelectedImage(result.assets[0].uri);
      } else {
        console.log("La selección de imagen fue cancelada.");
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    }
  };

  const handleSendReport = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Por favor, complete todos los campos requeridos.");
      return;
    }
    setIsLoading(true);
    try {
      let imageUrl = "";
      if (selectedImage) {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        const storageRef = ref(storage, `images/${no_card}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      const db = getFirestore();
      const q = query(
        collection(db, "reports"),
        orderBy("folio", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      let newFolio = 300;
      querySnapshot.forEach((doc) => {
        const lastFolio = doc.data().folio;
        newFolio = lastFolio + 1;
      });

      const reportData = {
        date: currentDate,
        time: currentTime,
        area: selectedArea,
        no_card,
        computerData,
        servicePerformed,
        folio: newFolio,
        status: "Pendiente",
        notification: true,
        imagen: imageUrl,
      };

      await addDoc(collection(db, "reports"), reportData);
      setSelectedArea(areas.length > 0 ? areas[0].area : "");
      setSelectedImage(null);
      setNoCard("");
      setDatosDelEquipo("");
      setServicioARealizar("");
      Alert.alert(
        "Reporte enviado",
        `El reporte se ha enviado correctamente. Folio: ${newFolio}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error enviando reporte:", error);
      Alert.alert("Error", "No se pudo enviar el reporte.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require("../assets/back_icon.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.header}>Solicitud de Reporte</Text>
        <View style={styles.form}>
          <Text style={styles.dateLabel}>Fecha: {currentDate}</Text>
          <Text style={styles.timeLabel}>Hora: {currentTime}</Text>

          <Text style={styles.label}>Área</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedArea}
              onValueChange={(itemValue) => setSelectedArea(itemValue)}
              style={styles.picker}
            >
              {areas.map((area, index) => (
                <Picker.Item key={index} label={area.area} value={area.area} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>
              Seleccionar Foto de la Galería
            </Text>
          </TouchableOpacity>
          {selectedImage && (
            <>
              <TouchableOpacity onPress={toggleModal}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                />
              </TouchableOpacity>
              <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                  setModalVisible(!modalVisible);
                }}
              >
                <View style={styles.centeredView}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.fullScreenImage}
                  />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={toggleModal}
                  >
                    <Text style={styles.textStyle}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </Modal>
            </>
          )}

          <Text style={styles.label}>Número de Tarjeta</Text>
          <TextInput
            placeholder="Número de Tarjeta"
            value={no_card}
            onChangeText={setNoCard}
            style={[styles.inputShort, errors.no_card && styles.errorBorder]}
          />
          {errors.no_card && (
            <Text style={styles.errorText}>Este campo es requerido</Text>
          )}
          <Text style={styles.label}>Datos del Equipo</Text>
          <TextInput
            placeholder="Datos del Equipo"
            value={computerData}
            onChangeText={setDatosDelEquipo}
            style={[
              styles.inputLarge,
              errors.computerData && styles.errorBorder,
            ]}
            multiline
          />
          {errors.computerData && (
            <Text style={styles.errorText}>Este campo es requerido</Text>
          )}
          <Text style={styles.label}>Descripción del Problema</Text>
          <TextInput
            placeholder="Descripción del Problema"
            value={servicePerformed}
            onChangeText={setServicioARealizar}
            style={[
              styles.inputLarge,
              errors.servicePerformed && styles.errorBorder,
            ]}
            multiline
          />
          {errors.servicePerformed && (
            <Text style={styles.errorText}>Este campo es requerido</Text>
          )}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#154F3A" />
            </View>
          )}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSendReport}
          >
            <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
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
  header: {
    fontSize: 35,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#154F3A",
  },
  form: {
    padding: 20,
  },
  dateLabel: {
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "right",
    marginBottom: 10,
  },
  timeLabel: {
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "right",
    marginBottom: 20,
  },
  input: {
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  inputLarge: {
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  inputShort: {
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    height: 50,
    textAlignVertical: "center",
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: "#154F3A",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 16,
  },
  pickerContainer: {
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
  },
  picker: {
    width: "100%",
    height: 50,
  },
  errorBorder: {
    borderColor: "red",
    borderWidth: 2,
  },
  errorText: {
    color: "red",
    marginTop: 1,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#154F3A",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 20,
  },
  textStyle: {
    color: "black",
    fontWeight: "bold",
    textAlign: "center",
  },
  previewImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 10,
  },
});
