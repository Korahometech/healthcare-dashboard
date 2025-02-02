import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#112233',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#112233',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#112233',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontWeight: 'bold',
    color: '#444444',
  },
  value: {
    flex: 1,
    color: '#666666',
  },
  symptomEntry: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#F8F9FA',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#666666',
    fontSize: 10,
  },
});

interface SymptomJournalEntry {
  dateRecorded: string;
  symptoms: string[];
  severity: number;
  mood: string;
  notes?: string;
  analysis?: Array<{
    analysis: string;
    sentiment: string;
    suggestedActions?: string[];
  }>;
}

interface Appointment {
  date: Date;
  doctor: {
    name: string;
    specialty?: {
      name: string;
    };
  };
  status: string;
  notes?: string;
}

interface HealthReportProps {
  patient: {
    name: string;
    dateOfBirth?: string;
    healthConditions?: string[];
    medications?: string[];
    allergies?: string[];
  };
  symptomJournals: SymptomJournalEntry[];
  appointments: Appointment[];
  generatedDate: Date;
}

export function HealthReportTemplate({
  patient,
  symptomJournals,
  appointments,
  generatedDate,
}: HealthReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Health Report</Text>
          <Text style={styles.subtitle}>Generated on {format(generatedDate, "MMMM d, yyyy")}</Text>
        </View>

        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{patient.name}</Text>
          </View>
          {patient.dateOfBirth && (
            <View style={styles.row}>
              <Text style={styles.label}>Date of Birth:</Text>
              <Text style={styles.value}>{patient.dateOfBirth}</Text>
            </View>
          )}
        </View>

        {/* Health Conditions */}
        {patient.healthConditions && patient.healthConditions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Conditions</Text>
            {patient.healthConditions.map((condition, index) => (
              <Text key={index} style={styles.value}>• {condition}</Text>
            ))}
          </View>
        )}

        {/* Medications */}
        {patient.medications && patient.medications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Medications</Text>
            {patient.medications.map((medication, index) => (
              <Text key={index} style={styles.value}>• {medication}</Text>
            ))}
          </View>
        )}

        {/* Allergies */}
        {patient.allergies && patient.allergies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allergies</Text>
            {patient.allergies.map((allergy, index) => (
              <Text key={index} style={styles.value}>• {allergy}</Text>
            ))}
          </View>
        )}

        {/* Recent Appointments */}
        {appointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Appointments</Text>
            {appointments.map((appointment, index) => (
              <View key={index} style={styles.symptomEntry}>
                <View style={styles.row}>
                  <Text style={styles.label}>Date:</Text>
                  <Text style={styles.value}>
                    {format(new Date(appointment.date), "MMMM d, yyyy")}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Doctor:</Text>
                  <Text style={styles.value}>
                    {appointment.doctor.name}
                    {appointment.doctor.specialty?.name && ` (${appointment.doctor.specialty.name})`}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Status:</Text>
                  <Text style={styles.value}>{appointment.status}</Text>
                </View>
                {appointment.notes && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Notes:</Text>
                    <Text style={styles.value}>{appointment.notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Symptom Journal */}
        {symptomJournals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Symptom Journal</Text>
            {symptomJournals.map((entry, index) => (
              <View key={index} style={styles.symptomEntry}>
                <View style={styles.row}>
                  <Text style={styles.label}>Date:</Text>
                  <Text style={styles.value}>
                    {format(new Date(entry.dateRecorded), "MMMM d, yyyy")}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Symptoms:</Text>
                  <Text style={styles.value}>{entry.symptoms.join(", ")}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Severity:</Text>
                  <Text style={styles.value}>{entry.severity}/10</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Mood:</Text>
                  <Text style={styles.value}>{entry.mood}</Text>
                </View>
                {entry.notes && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Notes:</Text>
                    <Text style={styles.value}>{entry.notes}</Text>
                  </View>
                )}
                {entry.analysis && entry.analysis[0] && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Analysis:</Text>
                    <Text style={styles.value}>{entry.analysis[0].analysis}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          This report was automatically generated and should be reviewed by a healthcare professional.
          The information contained in this report is confidential and intended for the patient and their healthcare providers only.
        </Text>
      </Page>
    </Document>
  );
}
