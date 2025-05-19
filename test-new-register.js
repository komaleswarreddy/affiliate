import axios from 'axios';
import 'dotenv/config';

// Generate random ID to ensure unique email and subdomain for each test
const randomId = Math.floor(Math.random() * 100000);

// Configure test data
const userData = {
  firstName: 'Test',
  lastName: 'User',
  email: `testuser${randomId}@example.com`,
  password: 'Test123!', // Strong password with uppercase, lowercase, number and special char
  confirmPassword: 'Test123!',
  companyName: 'Test Company',
  tenant: `testco${randomId}`,
  termsAccepted: true,
  marketingConsent: false,
  acceptTerms: true  // Added the missing field
};

// API configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const registerEndpoint = `${API_URL}/auth/register`;

console.log('==== Registration Test with New Database ====');
console.log('Test data:');
console.log(`- First Name: ${userData.firstName}`);
console.log(`- Last Name: ${userData.lastName}`);
console.log(`- Email: ${userData.email}`);
console.log(`- Password: ${'*'.repeat(userData.password.length)}`);
console.log(`- Company Name: ${userData.companyName}`);
console.log(`- Tenant: ${userData.tenant}`);
console.log(`- Terms Accepted: ${userData.acceptTerms}`);
console.log(`- Marketing Consent: ${userData.marketingConsent}`);
console.log('\nAPI Endpoint:');
console.log(`- ${registerEndpoint}`);
console.log('\nExecuting test...');

// Function to test registration
async function testRegistration() {
  try {
    console.log(`Sending POST request to ${registerEndpoint}...`);
    
    const startTime = Date.now();
    const response = await axios.post(registerEndpoint, userData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const endTime = Date.now();
    
    console.log('\n✅ SUCCESS! Registration completed successfully.');
    console.log(`Response time: ${endTime - startTime}ms`);
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    
    console.log('\nResponse data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n==== TEST PASSED ====');
    console.log(`User "${userData.email}" registered successfully!`);
    console.log(`Tenant "${userData.tenant}" created successfully!`);
    console.log('\nYou can now log in with these credentials.');
    
    return true;
  } catch (error) {
    console.error('\n❌ ERROR! Registration failed.');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      
      // Provide specific feedback based on error response
      if (error.response.data && error.response.data.error) {
        console.error('\nError details:', error.response.data.error);
        
        if (error.response.status === 400) {
          console.error('\nValidation error detected. Check your input data.');
          
          // Check for common validation issues
          if (error.response.data.error.includes('subdomain')) {
            console.error('- The tenant subdomain may be invalid or already in use');
          }
          if (error.response.data.error.includes('email')) {
            console.error('- The email address may be invalid or already in use');
          }
          if (error.response.data.error.includes('password')) {
            console.error('- The password may not meet strength requirements');
          }
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server. The server may be down or not reachable.');
      console.error('Request details:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error creating request:', error.message);
    }
    
    console.error('\nRequest configuration:');
    console.error('- URL:', error.config?.url);
    console.error('- Method:', error.config?.method);
    console.error('- Headers:', JSON.stringify(error.config?.headers, null, 2));
    
    console.error('\n==== TEST FAILED ====');
    
    return false;
  }
}

// Run the test
testRegistration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error during test:', error);
    process.exit(1);
  }); 