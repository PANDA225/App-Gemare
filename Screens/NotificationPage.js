import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";

const NotificationPage = () => {
  const [reports, setReports] = useState([]);
  const route = useRoute();
  const navigation = useNavigation();
  const userEmail = route.params?.userEmail;
  useEffect(() => {
    const db = getFirestore();
    const reportsCollection = collection(db, "reports");
    const reportsQuery = query(
      reportsCollection,
      where("technicianEmail", "==", userEmail),
      where("notificationTech", "==", true)
    );
    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const fetchedReports = snapshot.docs.map((doc) => {
        const data = doc.data();
        const notificationTime = data.notificationTime
          ? new Date(data.notificationTime.seconds * 1000)
          : null;
        return { id: doc.id, ...data, notificationTime };
      });
      setReports(fetchedReports);
    });

    return () => unsubscribe();
  }, [userEmail]);

  const handleNotificationPress = async (report) => {
    navigation.navigate("ReportDetailsPageTech", { report });
    await handleNotificationDelete(report);
  };
  const handleNotificationDelete = async (report) => {
    const db = getFirestore();
    const reportRef = doc(db, "reports", report.id);
    await updateDoc(reportRef, {
      notificationTech: false,
    });
    setReports(reports.filter((item) => item.id !== report.id));
  };

  return (
    <ScrollView style={styles.container}>
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
      <Text style={styles.header}>Notificaciones</Text>
      {reports.map((report) => (
        <TouchableOpacity
          key={report.id}
          style={styles.notification}
          onPress={() => handleNotificationPress(report)}
        >
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitleNew}>
              !Nuevo Reporte Asignado!
            </Text>
            <Text style={styles.notificationTitle}>Folio: {report.folio}</Text>
            <Text style={styles.notificationText}>
              Fecha: {report.date} / Hora: {report.time}
            </Text>
            <Text style={styles.notificationText}>Estado: {report.status}</Text>
            {report.notificationTime && (
              <Text style={styles.notificationText}>
                Hora de notificación:{" "}
                {report.notificationTime.toLocaleTimeString()}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleNotificationDelete(report)}
          >
            <Icon name="delete" size={24} color="#FF0000" />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FFFFFF" },
  backButton: { marginLeft: 1, marginTop: 20, zIndex: 10 },
  backIcon: { marginTop: 20, marginLeft: 10, width: 24, height: 18 },
  header: {
    fontSize: 35,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#154F3A",
  },
  notification: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  notificationTitleNew: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#154F3A",
    textAlign: "center",
  },
  notificationText: {
    fontSize: 16,
    color: "#000",
  },
  deleteButton: {
    padding: 10,
  },
  deleteIcon: {
    width: 24,
    height: 24,
  },
});
export default NotificationPage;
