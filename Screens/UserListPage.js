import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";

export default function UserListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prevUserCount, setPrevUserCount] = useState(0);
  const [showPasswordId, setShowPasswordId] = useState(null);
  const [userTypeFilter, setUserTypeFilter] = useState(null);
  const toggleShowPassword = (userId) => {
    setShowPasswordId(showPasswordId === userId ? null : userId);
  };

  useEffect(() => {
    fetchUsers();
    subscribeToUserChanges();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchUsers();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (users.length > prevUserCount) {
      fetchUsers();
    }
  }, [users, prevUserCount]);

  const fetchUsers = async () => {
    try {
      const db = getFirestore();
      const usersSnapshot = await getDocs(collection(db, "users"));
      const fetchedUsers = [];
      usersSnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() });
      });
      setPrevUserCount(users.length);
      setUsers(fetchedUsers);
      setLoading(false);
    } catch (error) {
      console.error("Error al recuperar el documento: ", error);
      setLoading(false);
    }
  };

  const subscribeToUserChanges = () => {
    const db = getDatabase();
    const usersRef = ref(db, "users");
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const updatedUsers = Object.keys(data).map((key) => ({
          id: key,
          email: data[key].email,
          technicianName: data[key].technicianName,
          userName: data[key].userName,
          userType: data[key].userType,
          area: data[key].area,
          technicianService: data[key].technicianService,
        }));
        setUsers(updatedUsers);
      }
    });
  };

  const deleteUser = async (userId) => {
    try {
      setLoading(true);
      const db = getFirestore();
      await deleteDoc(doc(db, "users", userId));
      const updatedUsers = users.filter((user) => user.id !== userId);
      setUsers(updatedUsers);
      setLoading(false);
      Alert.alert(
        "Usuario eliminado",
        "El usuario ha sido eliminado exitosamente."
      );
    } catch (error) {
      setLoading(false);
      console.error("Error al eliminar el usuario: ", error);
      Alert.alert("Error", "No se pudo eliminar el usuario");
    }
  };

  const filteredUsers = userTypeFilter
    ? users.filter((user) => user.userType === userTypeFilter)
    : users;

  return (
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
      <Text style={styles.header}>Lista de Usuarios</Text>
      <Picker
        selectedValue={userTypeFilter}
        style={styles.filterPicker}
        onValueChange={(itemValue, itemIndex) => setUserTypeFilter(itemValue)}
      >
        <Picker.Item label="Todos" value={null} />
        <Picker.Item label="Administrador" value="Administrador" />
        <Picker.Item label="Usuario" value="Usuario" />
        <Picker.Item label="Técnico" value="Tecnico" />
      </Picker>
      {loading ? (
        <ActivityIndicator size="large" color="#154F3A" />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <View style={styles.userInfo}>
                <Text style={[styles.userTypeTitle, { color: "#154F3A" }]}>
                  {item.userType}
                </Text>
                <Text>Email: {item.email}</Text>
                {item.userName && <Text>Nombre: {item.userName}</Text>}
                {item.technicianName && (
                  <Text>Nombre: {item.technicianName}</Text>
                )}
                {item.area && <Text>Área: {item.area}</Text>}
                {item.technicianService && (
                  <Text>Servicio: {item.technicianService}</Text>
                )}
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  onPress={() => toggleShowPassword(item.id)}
                  style={styles.showPasswordButton}
                >
                  <Text style={styles.showPasswordButtonText}>
                    {showPasswordId === item.id ? "Ocultar" : "Contraseña"}
                  </Text>
                </TouchableOpacity>
                {showPasswordId === item.id && (
                  <Text style={styles.passwordText}>{item.password}</Text>
                )}
                <TouchableOpacity
                  onPress={() => deleteUser(item.id)}
                  style={styles.deleteButton}
                >
                  <Icon
                    name="delete"
                    size={30}
                    color="red"
                    onPress={() => deleteUser(item.id)}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      <TouchableOpacity
        onPress={() => navigation.navigate("Register")}
        style={[styles.button, styles.buttonOutline]}
      >
        <Text style={styles.buttonOutlineText}>Registrar Usuario</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  header: {
    fontSize: 35,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#154F3A",
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
  userItem: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  deleteButton: {
    backgroundColor: "#FF0000",
    padding: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
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
    color: "#ffffff",
    fontWeight: "bold",
  },
  buttonOutline: {
    backgroundColor: "#154F3A",
  },
  buttonOutlineText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontWeight: "bold",
  },
  userTypeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  deleteButton: {
    padding: 10,
    borderRadius: 5,
  },
  deleteIcon: {
    width: 44,
    height: 44,
  },
  userInfo: {
    flex: 1,
  },
  userActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  showPasswordButton: {
    marginRight: 10,
    backgroundColor: "#154F3A",
    padding: 5,
    borderRadius: 5,
  },
  showPasswordButtonText: {
    color: "#ffffff",
  },
  passwordText: {
    marginRight: 10,
    color: "#154F3A",
  },
  filterPicker: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#154F3A",
    borderRadius: 5,
  },
});
