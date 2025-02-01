import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { type ClientSchema } from '@aws-amplify/backend/data';

export type Schema = ClientSchema<typeof data>;

defineBackend({
  auth,
  data,
});