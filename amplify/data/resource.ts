import { defineData } from '@aws-amplify/backend';

export const schema = defineData({
  schema: {
    models: {
      Patient: {
        primaryIndex: { partitionKey: 'id' },
        attributes: {
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
        primaryIndex: { partitionKey: 'id' },
        attributes: {
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
        primaryIndex: { partitionKey: 'id' },
        attributes: {
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
        primaryIndex: { partitionKey: 'id' },
        attributes: {
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
  }
});

export type Schema = typeof schema;
export default schema;