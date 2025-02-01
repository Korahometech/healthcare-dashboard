import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
    phone: false,
    username: true
  },
  /**
   * Customize Cognito workflows here:
   * - Add custom user attributes
   * - Configure multi-factor authentication
   * - Set password requirements
   * - Configure sign-up/sign-in requirements
   */
  userAttributes: {
    /** Predefined Cognito attributes */
    preferredUsername: {
      required: false,
      mutable: true
    },
    email: {
      required: true,
      mutable: true
    },
    phoneNumber: {
      required: false, 
      mutable: true
    },
    /** Custom attributes */
    role: {
      required: true,
      mutable: false,
      type: 'String',
      values: ['patient', 'doctor', 'admin']
    }
  },
  multiFactor: {
    mode: 'OPTIONAL',
    sms: true
  },
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialCharacters: true
  }
});
