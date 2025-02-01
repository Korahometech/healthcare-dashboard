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
  header: {
    borderBottom: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 8,
    marginTop: 15,
    color: "#374151",
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
    color: "#4B5563",
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
  highlight: {
    backgroundColor: "#F3F4F6",
    padding: 8,
    marginVertical: 5,
    borderRadius: 4,
  },
  table: {
    display: "table",
    width: "100%",
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    padding: 8,
  },
  tableHeader: {
    backgroundColor: "#F3F4F6",
    fontWeight: "bold",
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 10,
    color: "#9CA3AF",
  },
});

export function DashboardPDFReport({ data }: { data: any }) {
  const currentDate = new Date();
  const formatPercent = (value: number) => `${Math.round(value)}%`;
  const formatCount = (value: number) => value.toLocaleString();

  // Calculate additional metrics
  const completionRate = (data.summary.confirmedAppointments / data.summary.totalAppointments) * 100;
  const cancellationRate = (data.summary.canceledAppointments / data.summary.totalAppointments) * 100;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Healthcare Dashboard Report</Text>
          <Text style={styles.text}>
            Generated on: {format(currentDate, "MMMM d, yyyy 'at' h:mm a")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Executive Summary</Text>
          <View style={styles.highlight}>
            <Text style={styles.text}>
              Total Patients: {formatCount(data.summary.totalPatients)}
            </Text>
            <Text style={styles.text}>
              Total Appointments: {formatCount(data.summary.totalAppointments)}
            </Text>
            <Text style={styles.text}>
              Appointment Completion Rate: {formatPercent(completionRate)}
            </Text>
            <Text style={styles.text}>
              Cancellation Rate: {formatPercent(cancellationRate)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Monthly Performance</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Month</Text>
              <Text style={styles.tableCell}>Appointments</Text>
              <Text style={styles.tableCell}>New Patients</Text>
            </View>
            {data.monthlyStats.map((stat: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{stat.name}</Text>
                <Text style={styles.tableCell}>{stat.appointments}</Text>
                <Text style={styles.tableCell}>{stat.patients}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Appointment Status Distribution</Text>
          {data.appointmentsByStatus.map((status: any, index: number) => (
            <View key={index} style={styles.highlight}>
              <Text style={styles.text}>
                {status.name}: {status.value} ({formatPercent((status.value / data.summary.totalAppointments) * 100)})
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Recent Appointments</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Date</Text>
              <Text style={styles.tableCell}>Patient</Text>
              <Text style={styles.tableCell}>Status</Text>
              <Text style={styles.tableCell}>Notes</Text>
            </View>
            {data.appointments.slice(0, 10).map((appointment: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{appointment.date}</Text>
                <Text style={styles.tableCell}>{appointment.patientName}</Text>
                <Text style={styles.tableCell}>{appointment.status}</Text>
                <Text style={styles.tableCell}>{appointment.notes}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.text, { marginTop: 5, fontStyle: 'italic' }]}>
            * Showing 10 most recent appointments
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>
            Report generated by Healthcare Management Platform | Page 1 of 1
          </Text>
        </View>
      </Page>
    </Document>
  );
}