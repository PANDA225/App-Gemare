import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase-config";
import { FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
} from "firebase/firestore";

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [userType, setUserType] = useState("Administrador");
  const [technicianName, setTechnicianName] = useState("");
  const [technicianService, setTechnicianService] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areasSnapshot = await getDocs(collection(db, "areas"));
        const areasData = areasSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().area,
        }));
        setAreas(areasData);
      } catch (error) {
        console.error("Error fetching areas:", error);
      }
    };
    fetchAreas();
  }, []);

  const handleRegister = () => {
    if (loading) return;
    setEmailError("");
    setLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        const userDocRef = doc(db, "users", user.uid);
        const userData = {
          email: user.email,
          userType: userType,
          password: password,
          ...(userType === "Tecnico" && { technicianName: technicianName }),
          ...(userType === "Tecnico" && {
            technicianService: technicianService,
          }),
          ...(userType === "Usuario" && { userName: userName }),
          ...(userType === "Usuario" &&
            selectedArea && { area: selectedArea.name }),
        };
        setDoc(userDocRef, userData)
          .then(() => {
            setLoading(false);
            navigation.navigate("UserListPage");
          })
          .catch((error) => {
            setLoading(false);
            console.error("Error al almacenar datos de usuario: ", error);
          });
      })
      .catch((error) => {
        setLoading(false);
        if (error.code === "auth/email-already-in-use") {
          setEmailError("El correo ya está registrado.");
        } else {
          setEmailError("Ocurrió un error al intentar registrarse.");
        }
      });
  };

  const renderTechnicianNameInput = () => (
    <View style={styles.pickerContainerText}>
      <Text style={styles.label}>Nombre del Técnico</Text>
      <TextInput
        placeholder="Introduce el nombre del técnico"
        value={technicianName}
        onChangeText={setTechnicianName}
        style={styles.input}
      />
      <Text style={styles.label}>Servicio del Técnico</Text>
      <TextInput
        placeholder="Introduce el servicio que labora"
        value={technicianService}
        onChangeText={setTechnicianService}
        style={styles.input}
      />
    </View>
  );
  const renderUserNameInput = () => (
    <View style={styles.pickerContainerText}>
      <Text style={styles.label}>Nombre de Usuario</Text>
      <TextInput
        placeholder="Introduce el nombre del usuario"
        value={userName}
        onChangeText={setUserName}
        style={styles.input}
      />
    </View>
  );

  const togglePasswordVisibility = () => {
    setHidePassword(!hidePassword);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Image
          source={require("./assets/back_icon.png")}
          style={styles.backIcon}
        />
      </TouchableOpacity>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Image source={require("./assets/Logo_IMSS.png")} style={styles.logo} />
        <Text style={styles.welcomeText}>¡Bienvenido!</Text>
        <Text style={styles.label}>Crear Correo</Text>
        <TextInput
          placeholder="Introduce tu correo"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        <Text style={styles.label}>Crear Contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Introduce tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={hidePassword}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.icon}
          >
            <FontAwesome5
              name={hidePassword ? "eye-slash" : "eye"}
              size={20}
              color="#154F3A"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Tipo de Usuario</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userType}
            onValueChange={(itemValue, itemIndex) => {
              setUserType(itemValue);
              if (itemValue !== "Tecnico") {
                setTechnicianName("");
              }
              setShowAreaPicker(itemValue === "Usuario");
            }}
            style={styles.picker}
          >
            <Picker.Item label="Administrador" value="Administrador" />
            <Picker.Item label="Usuario" value="Usuario" />
            <Picker.Item label="Técnico" value="Tecnico" />
          </Picker>
        </View>
        {userType === "Tecnico" && renderTechnicianNameInput()}
        {userType === "Usuario" && renderUserNameInput()}
        {showAreaPicker && (
          <View style={styles.pickerContainerText}>
            <Text style={styles.label}>Área del Usuario</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedArea}
                onValueChange={(itemValue, itemIndex) =>
                  setSelectedArea(itemValue)
                }
                style={styles.picker}
              >
                {areas.map((area, index) => (
                  <Picker.Item key={index} label={area.name} value={area} />
                ))}
              </Picker>
            </View>
          </View>
        )}
        {loading ? (
          <ActivityIndicator size="large" color="#154F3A" />
        ) : (
          <TouchableOpacity onPress={handleRegister} style={styles.button}>
            <Text style={styles.buttonText}>Registrarse</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
  },
  backButton: {
    marginLeft: 1,
    marginTop: 40,
    zIndex: 10,
  },
  backIcon: {
    marginTop: 20,
    marginLeft: 30,
    width: 24,
    height: 18,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginVertical: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 20,
    color: "#154F3A",
  },
  label: {
    alignSelf: "flex-start",
    marginLeft: 5,
    marginBottom: 5,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  passwordContainer: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 5,
  },
  icon: {
    position: "absolute",
    right: 15,
    top: 20,
  },
  button: {
    backgroundColor: "#154F3A",
    width: "100%",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  errorText: {
    width: "100%",
    textAlign: "left",
    color: "red",
    marginBottom: 10,
  },
  pickerContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 25,
  },
  pickerContainerText: {
    width: "100%",
    borderRadius: 5,
    marginBottom: 5,
  },
  picker: {
    width: "100%",
  },
});
export default RegisterScreen;
