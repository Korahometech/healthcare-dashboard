import { defineData } from '@aws-amplify/backend';
import { type ClientSchema, Schema } from '@aws-amplify/backend/data';

export const schema = defineData({
  schema: {
    Patient: {
      primaryKey: { partitionKey: 'id' },
      fields: {
        id: 'String',
        name: 'String!',
        email: 'String!',
        phone: 'String',
        dateOfBirth: 'AWSDate',
        healthConditions: '[String]',
        medications: '[String]',
        allergies: '[String]',
        chronicConditions: '[String]',
        appointments: { hasMany: 'Appointment' },
        labResults: { hasMany: 'LabResult' },
        createdAt: 'AWSDateTime',
        updatedAt: 'AWSDateTime'
      }
    },
    Doctor: {
      primaryKey: { partitionKey: 'id' },
      fields: {
        id: 'String',
        name: 'String!',
        email: 'String!',
        phone: 'String',
        specialtyId: 'Int',
        qualification: 'String',
        experience: 'Int',
        availableDays: '[String]',
        appointments: { hasMany: 'Appointment' },
        createdAt: 'AWSDateTime',
        updatedAt: 'AWSDateTime'
      }
    },
    Appointment: {
      primaryKey: { partitionKey: 'id' },
      fields: {
        id: 'String',
        patientId: 'String!',
        doctorId: 'String!',
        date: 'AWSDateTime!',
        status: {
          type: 'String',
          values: ['scheduled', 'confirmed', 'cancelled']
        },
        notes: 'String',
        isTeleconsultation: 'Boolean',
        meetingUrl: 'String',
        patient: { belongsTo: 'Patient' },
        doctor: { belongsTo: 'Doctor' },
        createdAt: 'AWSDateTime',
        updatedAt: 'AWSDateTime'
      }
    },
    LabResult: {
      primaryKey: { partitionKey: 'id' },
      fields: {
        id: 'String',
        patientId: 'String!',
        testType: 'String!',
        testDate: 'AWSDateTime!',
        result: 'String!',
        referenceMin: 'Float',
        referenceMax: 'Float',
        unit: 'String',
        notes: 'String',
        patient: { belongsTo: 'Patient' },
        createdAt: 'AWSDateTime',
        updatedAt: 'AWSDateTime'
      }
    }
  }
});

export type Schema = ClientSchema<typeof schema>;
export default schema;