import React, { useState, version } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase-config";
import { FontAwesome5 } from "@expo/vector-icons";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const handleLogin = async () => {
    setLoading(true);
    setIsError(false);
    setError("");
    try {
      const userCredentials = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredentials.user;
      await AsyncStorage.setItem("isLoggedIn", "true");
      const db = getFirestore();
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        navigation.navigate(`${userData.userType}Page`, {
          userEmail: email,
          technicianName: userData.technicianName,
          userName: userData.userName,
          area: userData.area,
        });
      } else {
        console.log("No user data found!");
      }
    } catch (error) {
      setError("Correo o contraseña incorrectos");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setHidePassword(!hidePassword);
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
      onLogin: () => handleLogin(),
    });
  }, [navigation]);

  const inputStyle = isError ? styles.inputError : styles.input;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Image source={require("./assets/Logo_IMSS.png")} style={styles.logo} />
      <Text style={styles.welcomeText}>¡Bienvenido!</Text>
      {isError && <Text style={styles.errorText}>{error}</Text>}
      <Text style={styles.label}>Correo</Text>
      <TextInput
        placeholder="Introduce Tu Correo"
        value={email}
        onChangeText={setEmail}
        style={inputStyle}
        autoCapitalize="none"
      />
      <Text style={styles.label}>Contraseña</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Introduce Tu Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={hidePassword}
          style={[inputStyle, { flex: 1 }]}
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
      {loading ? (
        <ActivityIndicator size="large" color="#154F3A" />
      ) : (
        <TouchableOpacity onPress={handleLogin} style={styles.button}>
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.version}>Versión 1.0.2</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    alignSelf: "flex-start",
    width: "100%",
    marginBottom: 5,
    marginLeft: 5,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  passwordContainer: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 20,
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
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  inputError: {
    width: "100%",
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 5,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  version: {
    color: "#154F3A",
    marginTop: 40,
  },
});
export default Login;
