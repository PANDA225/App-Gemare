import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { BarChart, PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const screenWidth = Dimensions.get("window").width;

export default function DashboardPage({ navigation }) {
  const [selectedArea, setSelectedArea] = useState("Todos");
  const [areas, setAreas] = useState(["Todos"]);
  const [reportsData, setReportsData] = useState([]);
  const [totalReports, setTotalReports] = useState(0);
  const [barData, setBarData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [averageRepairTime, setAverageRepairTime] = useState("0:00");

  useEffect(() => {
    const fetchAreas = async () => {
      const db = getFirestore();
      const querySnapshot = await getDocs(collection(db, "areas"));
      const areasList = querySnapshot.docs.map((doc) => doc.data().area);
      setAreas(["Todos", ...areasList]);
    };

    const fetchReports = async () => {
      const db = getFirestore();
      const querySnapshot = await getDocs(collection(db, "reports"));
      const reportsList = querySnapshot.docs.map((doc) => doc.data());

      const completedReports = reportsList.filter(
        (report) => report.status === "Completado"
      );

      const filteredReports =
        selectedArea === "Todos"
          ? completedReports
          : completedReports.filter((report) => report.area === selectedArea);

      const folios = [];
      const elapsedTimes = [];

      filteredReports.forEach((report) => {
        folios.push(report.folio.toString());

        const parseDateTime = (date, time) => {
          const [day, month, year] = date.split("/").map(Number);
          const [hours, minutes] = time.split(":").map(Number);
          return new Date(year, month - 1, day, hours, minutes);
        };

        const startDateTime = parseDateTime(report.date, report.time);
        const finishDateTime = parseDateTime(
          report.dateFinish,
          report.timeFinish
        );

        const elapsedTimeMs = finishDateTime - startDateTime;
        const elapsedTimeTotalMinutes = Math.floor(elapsedTimeMs / (1000 * 60));
        const elapsedTimeHours = Math.floor(elapsedTimeTotalMinutes / 60);
        const elapsedTimeMinutes = elapsedTimeTotalMinutes % 60;

        const elapsedTimeInHours = elapsedTimeHours + elapsedTimeMinutes / 60;
        elapsedTimes.push(elapsedTimeInHours);
      });

      setBarData({
        labels: folios,
        datasets: [
          {
            data: elapsedTimes,
          },
        ],
      });
      let totalMinutes = 0;
      elapsedTimes.forEach((time) => {
        totalMinutes += Math.round(time * 60);
      });
      const averageTimeMinutes = Math.round(totalMinutes / elapsedTimes.length);
      const hours = Math.floor(averageTimeMinutes / 60);
      const minutes = averageTimeMinutes % 60;
      const formattedAverageTime = `${hours}:${
        minutes < 10 ? "0" : ""
      }${minutes}`;
      setAverageRepairTime(formattedAverageTime);
      setTotalReports(filteredReports.length);

      const areaReportsMap = {};
      filteredReports.forEach((report) => {
        const areaName = report.area;
        if (!areaReportsMap[areaName]) {
          areaReportsMap[areaName] = 0;
        }
        areaReportsMap[areaName]++;
      });

      const reportDataForPieChart = Object.keys(areaReportsMap).map(
        (areaName) => {
          return {
            name: areaName,
            population: areaReportsMap[areaName],
            percentage:
              (areaReportsMap[areaName] / filteredReports.length) * 100,
            color: getRandomColor(),
          };
        }
      );

      setReportsData(reportDataForPieChart);
    };

    fetchAreas();
    fetchReports();
  }, [selectedArea]);

  const handlePieChartPress = (data) => {
    Alert.alert(
      `Total de Reportes en ${data.name}`,
      `Total: ${data.population}`
    );
  };

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const chartConfig = {
    backgroundGradientFrom: "#FFF",
    backgroundGradientTo: "#FFF",
    color: (opacity = 1) => `rgba(21, 79, 58, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(21, 79, 58, ${opacity})`,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    formatYLabel: (value) => {
      const hours = Math.floor(value);
      const minutes = Math.round((value - hours) * 60);
      return `${hours}h ${minutes}m`;
    },
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
        <Text style={styles.header}>Dashboard</Text>
        <Text style={styles.pickerTitle}>Filtrar por Área</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedArea}
            onValueChange={(itemValue) => setSelectedArea(itemValue)}
            style={styles.picker}
          >
            {areas.map((area, index) => (
              <Picker.Item label={area} value={area} key={index} />
            ))}
          </Picker>
        </View>
        <Text style={styles.chartTitle}>Tiempo Promedio de Reparación</Text>
        <BarChart
          data={barData}
          width={screenWidth - 40}
          height={220}
          yAxisLabel=""
          chartConfig={chartConfig}
          verticalLabelRotation={30}
          style={styles.chart}
          fromZero
          withVerticalLabels={true}
        />
        <View style={styles.averageTimeContainer}>
          <Text style={styles.averageTimeTitle}>
            Tiempo Promedio de Reparación
          </Text>
          <View style={styles.averageTimeBackground}>
            <Text style={styles.averageTimeText}>{averageRepairTime} H</Text>
          </View>
        </View>
        <Text style={styles.chartTitle}>Total de Reportes: {totalReports}</Text>
        <PieChart
          data={reportsData}
          width={screenWidth - 25}
          height={250}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) =>
              opacity < 1
                ? `rgba(255, 255, 255, ${opacity})`
                : `rgba(123, 31, 162, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          style={styles.chart}
          onDataPointClick={({ name, population }) =>
            handlePieChartPress({ name, population })
          }
        />
        {reportsData.map((report, index) => (
          <Text key={index} style={styles.reportInfo}>
            {report.name}: {report.percentage.toFixed(2)}% - {report.population}{" "}
            reporte(s)
          </Text>
        ))}
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.buttonText}>Descargar en PDF</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
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
  addButton: {
    backgroundColor: "#154F3A",
    padding: 15,
    marginTop: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  pickerTitle: {
    fontSize: 18,
    textAlign: "left",
    marginVertical: 4,
    color: "#154F3A",
    marginBottom: 20,
  },
  pickerContainer: {
    flex: 1,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
  },
  picker: {
    flex: 1,
  },
  chartTitle: {
    borderTopWidth: 1,
    paddingTop: 20,
    borderColor: "gray",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  reportInfo: {
    fontSize: 16,
    color: "#154F3A",
    textAlign: "left",
    marginVertical: 5,
  },
  averageTimeContainer: {
    marginTop: 20,
    backgroundColor: "#000",
    borderRadius: 20,
    padding: 5,
    marginBottom: 20,
  },
  averageTimeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 5,
    color: "#fff",
  },
  averageTimeText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 5,
    color: "#fff",
  },
});
