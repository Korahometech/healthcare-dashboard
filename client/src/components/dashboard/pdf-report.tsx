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

export function DashboardPDFReport({ data }: { data: any }) {
  const currentDate = new Date();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Healthcare Dashboard Report</Text>
          <Text style={styles.text}>
            Generated on: {format(currentDate, "MMMM d, yyyy")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.text}>
                Total Appointments: {data.appointmentsCount}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.text}>
                Active Patients: {data.patientsCount}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.text}>
                Doctors: {data.doctorsCount}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Recent Activity</Text>
          {data.recentActivity?.map((activity: any, index: number) => (
            <Text key={index} style={styles.text}>
              {activity.description} - {format(new Date(activity.date), "MMM d, yyyy")}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Key Metrics</Text>
          <Text style={styles.text}>
            Appointment Completion Rate: {data.metrics?.completionRate}%
          </Text>
          <Text style={styles.text}>
            Average Wait Time: {data.metrics?.avgWaitTime} minutes
          </Text>
          <Text style={styles.text}>
            Patient Satisfaction: {data.metrics?.patientSatisfaction}/5
          </Text>
        </View>
      </Page>
    </Document>
  );
}
