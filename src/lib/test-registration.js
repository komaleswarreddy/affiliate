/**
 * Test Registration Script
 * 
 * This script tests the user registration API to verify that the UUID generation issue is fixed.
 * Run it with: node src/lib/test-registration.js
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const API_URL = 'http://localhost:3000/api';
const ENDPOINT = '/auth/register';

// Generate unique test data
const timestamp = Date.now();
const testData = {
  firstName: 'Test',
  lastName: 'User',
  email: `test${timestamp}@example.com`,
  password: 'Test123!',
  companyName: 'Test Company',
  tenant: `test-${timestamp}`,
  acceptTerms: true
};

console.log('Testing registration with the following data:');
console.log(JSON.stringify(testData, null, 2));
console.log('\nSending request to:', API_URL + ENDPOINT);

// Make the API request
axios.post(API_URL + ENDPOINT, testData)
  .then(response => {
    console.log('\nRegistration successful! Response:');
    console.log('Status:', response.status);
    console.log('User ID:', response.data.user.id);
    console.log('User Email:', response.data.user.email);
    console.log('Tenant ID:', response.data.user.tenantId);
    console.log('Token received:', response.data.token ? 'Yes' : 'No');
  })
  .catch(error => {
    console.error('\nRegistration failed!');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error during request setup:', error.message);
    }
  }); 