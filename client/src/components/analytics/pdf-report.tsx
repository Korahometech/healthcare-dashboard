import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 8,
    marginTop: 15,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  statBox: {
    width: "50%",
    padding: 10,
  },
});

export function AnalyticsPDFReport({ data }: { data: any }) {
  const currentDate = new Date();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Healthcare Analytics Report</Text>
          <Text style={styles.text}>
            Generated on: {format(currentDate, "MMMM d, yyyy")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Key Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.text}>
                Total Patients: {data.patientStats.total}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.text}>
                Completion Rate: {data.appointmentStats.completionRate}%
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.text}>
                Cancellation Rate: {data.appointmentStats.cancellationRate}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Patient Demographics</Text>
          <Text style={styles.text}>Age Distribution:</Text>
          {data.patientStats.ageDistribution.map((item: any, index: number) => (
            <Text key={index} style={styles.text}>
              {item.age}: {item.count} patients
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Health Conditions</Text>
          {data.patientStats.healthConditions.map((condition: any, index: number) => (
            <Text key={index} style={styles.text}>
              {condition.name}: {condition.count} cases
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Report Summary</Text>
          <Text style={styles.text}>
            Time Range: {data.timeRange}
          </Text>
          <Text style={styles.text}>
            Total Appointments: {data.appointmentStats.total}
          </Text>
        </View>
      </Page>
    </Document>
  );
}