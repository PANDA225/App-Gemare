import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  Image,
  BackHandler,
} from "react-native";
import { FAB } from "react-native-paper";
import { signOut } from "firebase/auth";
import { auth } from "../firebase-config";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

export default function AdminPage({ navigation }) {
  const [state, setState] = useState({ open: false });
  const [hasNotifications, setHasNotifications] = useState(false);
  const onStateChange = ({ open }) => setState({ open });
  const { open } = state;
  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        navigation.navigate("Login");
      })
      .catch((error) => {
        console.error("Error al iniciar sesión:", error);
        Alert.alert("Error", "No se pudo cerrar la sesión correctamente.");
      });
  };

  useEffect(() => {
    const db = getFirestore();
    const q = query(
      collection(db, "reports"),
      where("notification", "==", true)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasNotifications(!snapshot.empty);
    });
    return () => unsubscribe();
  }, []);
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate("CreateReportPage")}
          style={styles.buttonWithLabel}
        >
          <Image
            source={require("../assets/create_report_icon.png")}
            style={[styles.buttonImage, { tintColor: "#154F3A" }]}
          />
          <Text style={styles.buttonLabel}>Crear Reporte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("ViewReportsPageAdmin")}
          style={styles.buttonWithLabel}
        >
          <Image
            source={require("../assets/view_report_icon.png")}
            style={[styles.buttonImage, { tintColor: "#154F3A" }]}
          />
          <Text style={styles.buttonLabel}>Ver Reportes</Text>
        </TouchableOpacity>
      </View>
      <FAB.Group
        open={open}
        icon={hasNotifications ? "bell-ring" : open ? "close" : "plus"}
        color="#FFFFFF"
        backdropColor="#00000000"
        fabStyle={[styles.fab, hasNotifications && styles.fabActive]}
        actions={[
          {
            icon: "cog",
            label: "Ajustes",
            onPress: () => {
              navigation.navigate("SettingsPage");
            },
            color: "#FFFFFF",
            style: { backgroundColor: "#000000", marginTop: -20 },
            labelStyle: styles.fabLabel,
          },
          {
            icon: hasNotifications ? "bell-ring" : "bell",
            label: `Notificaciones (${hasNotifications ? "1+" : "0"})`,
            onPress: () => {
              navigation.navigate("NotificationPageAdmin");
            },
            color: "#FFFFFF",
            style: {
              backgroundColor: hasNotifications ? "blue" : "#000000",
              marginTop: -20,
            },
            labelStyle: [
              styles.fabLabel,
              hasNotifications ? styles.notificationLabel : null,
            ],
          },
          {
            icon: "logout",
            label: "Cerrar Sesión",
            onPress: handleSignOut,
            color: "#FFFFFF",
            style: { backgroundColor: "red", marginTop: -20 },
            labelStyle: styles.fabLabel,
          },
        ]}
        onStateChange={onStateChange}
        style={{ position: "absolute", right: 16, bottom: 16 }}
        theme={{
          colors: {
            accent: "#154F3A",
            primary: "#154F3A",
            backdrop: "transparent",
          },
        }}
      >
        {hasNotifications && (
          <Image
            source={require("../assets/delete.png")}
            style={styles.notificationImage}
          />
        )}
      </FAB.Group>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    backgroundColor: "#154F3A",
  },
  fabLabel: {
    fontWeight: "bold",
    borderWidth: 1,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginTop: -20,
    color: "#000000",
  },
  buttonContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  buttonWithLabel: {
    marginBottom: 30,
    alignItems: "center",
    borderColor: "#154F3A",
    borderWidth: 2,
    padding: 15,
    borderRadius: 30,
  },
  buttonImage: {
    width: 150,
    height: 150,
  },
  buttonLabel: {
    margin: 10,
    color: "#154F3A",
    fontSize: 20,
    fontWeight: "bold",
  },
  notificationDot: {
    position: "absolute",
    backgroundColor: "red",
    width: 10,
    height: 10,
    borderRadius: 5,
    top: 8,
    right: 8,
  },
  notificationImage: {
    position: "absolute",
    width: 24,
    height: 24,
    top: -12,
    right: -12,
    zIndex: 1,
  },
  notificationLabel: {
    color: "blue",
  },
  fabActive: {
    backgroundColor: "blue",
  },
});
