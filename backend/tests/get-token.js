/**
 * Helper script to get a clean JWT token for testing
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Login and get JWT token
 */
async function getToken(email, password) {
  try {
    console.log('Attempting login...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    
    const token = response.data.token;
    
    if (!token) {
      throw new Error('No token received from login response');
    }
    
    // Clean the token
    const cleanedToken = token.trim().replace(/[\r\n\t\s]/g, '');
    
    console.log('Login successful!');
    console.log('\nUser Info:');
    console.log(`Name: ${response.data.user.name}`);
    console.log(`Email: ${response.data.user.email}`);
    console.log(`Role: ${response.data.user.role}`);
    console.log(`User ID: ${response.data.user._id}`);
    
    console.log('\nClean JWT Token:');
    console.log(cleanedToken);
    
    console.log('\nCopy this token to your test files:');
    console.log(`CLIENT_TOKEN: '${cleanedToken}',`);
    
    // Validate token format
    const parts = cleanedToken.split('.');
    if (parts.length === 3) {
      console.log('\nToken format is valid (3 parts)');
    } else {
      console.log('\nToken format is invalid');
    }
    
    return cleanedToken;
    
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('\nCheck your credentials:');
      console.log('   - Email: Make sure it exists in the database');
      console.log('   - Password: Verify the password is correct');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\nConnection refused:');
      console.log('   - Make sure your backend server is running (npm start)');
      console.log('   - Check if the server is running on port 5000');
    }
    
    throw error;
  }
}

/**
 * Test the token by making an authenticated request
 */
async function testToken(token) {
  try {
    console.log('\nTesting token...');
    
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Token is valid!');
    console.log(`Authenticated as: ${response.data.name} (${response.data.role})`);
    
    return true;
    
  } catch (error) {
    console.error('Token test failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Command line interface
if (require.main === module) {
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email || !password) {
    console.log('Usage: node get-token.js <email> <password>');
    console.log('\nExamples:');
    console.log('   node get-token.js client@test.com password123');
    console.log('   node get-token.js your@email.com yourpassword');
    console.log('\nMake sure your backend server is running first!');
    process.exit(1);
  }
  
  getToken(email, password)
    .then(token => testToken(token))
    .then(() => {
      console.log('\nReady to run concurrent tests!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nFailed to get token');
      process.exit(1);
    });
}

module.exports = { getToken, testToken };