import axios from 'axios';

// Registration data
const randomId = Math.floor(Math.random() * 10000);
const userData = {
  firstName: 'Test',
  lastName: 'User',
  email: `test${randomId}@example.com`,
  password: 'Password123!', 
  confirmPassword: 'Password123!',
  companyName: 'Test Company',
  tenant: `test${randomId}`,
  acceptTerms: true
};

// API endpoint
const API_URL = 'http://localhost:3000/api/auth/register';

console.log('Testing registration endpoint...');
console.log('User data:', {
  ...userData,
  password: '********',
  confirmPassword: '********'
});

async function testRegistration() {
  try {
    const response = await axios.post(API_URL, userData);
    console.log('Registration successful!');
    console.log('Status:', response.status);
    console.log('Response data:', response.data);
    return true;
  } catch (error) {
    console.error('Registration failed!');
    console.error('Status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response headers:', error.response.headers);
    }
    
    if (error.request) {
      console.error('Request config:', {
        url: error.config?.url,
        method: error.config?.method,
        data: JSON.parse(error.config?.data || '{}')
      });
    }
    
    return false;
  }
}

// Run the test
testRegistration()
  .then(success => {
    console.log(success ? 'Test passed!' : 'Test failed!');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 