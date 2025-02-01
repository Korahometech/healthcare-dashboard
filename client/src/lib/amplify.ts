import { Amplify } from 'aws-amplify';
import config from '../../../client/amplifyconfiguration.json';

// Configure Amplify with your configuration
Amplify.configure({
  ...config,
  ssr: false // Disable server-side rendering configuration
});

// Export configured Amplify instance
export { Amplify };