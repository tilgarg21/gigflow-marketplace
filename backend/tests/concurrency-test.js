/**
 * Concurrent Transaction Test Script
 * Tests race condition protection in the hire system
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_CONFIG = {
  // You'll need to replace these with actual IDs from your database
  CLIENT_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NjUxZjFkM2M5YmE3N2U2NjBmMzJmNCIsImlhdCI6MTc2ODIzNDg1MCwiZXhwIjoxNzcwODI2ODUwfQ.FaHcyN1RFS6MV4YStw3Ap3WcVV3joPEOqBsZgIm4IuY',
  BID_ID: '69651f1e3c9ba77e660f3306',
  CONCURRENT_REQUESTS: 5,
  DELAY_MS: 0 // No delay for maximum concurrency
};

/**
 * Clean and validate token
 */
function cleanToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token provided');
  }
  
  // Remove any whitespace, newlines, or special characters
  const cleaned = token.trim().replace(/[\r\n\t\s]/g, '');
  
  // Basic JWT format validation (should have 3 parts separated by dots)
  const parts = cleaned.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format - should have 3 parts separated by dots');
  }
  
  return cleaned;
}

/**
 * Simulate concurrent hire attempts
 */
async function testConcurrentHire() {
  console.log('Starting Concurrent Hire Test...\n');
  
  const promises = [];
  const results = [];
  
  // Create multiple simultaneous hire requests
  for (let i = 0; i < TEST_CONFIG.CONCURRENT_REQUESTS; i++) {
    const promise = makeHireRequest(i + 1)
      .then(result => {
        results.push({ requestId: i + 1, ...result });
        return result;
      })
      .catch(error => {
        results.push({ 
          requestId: i + 1, 
          success: false, 
          error: error.message,
          status: error.response?.status 
        });
        return { success: false, error: error.message };
      });
    
    promises.push(promise);
    
    // Optional: Add small delay between requests
    if (TEST_CONFIG.DELAY_MS > 0) {
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.DELAY_MS));
    }
  }
  
  // Wait for all requests to complete
  console.log(`📡 Sending ${TEST_CONFIG.CONCURRENT_REQUESTS} concurrent hire requests...`);
  const startTime = Date.now();
  
  await Promise.allSettled(promises);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Analyze results
  analyzeResults(results, duration);
}

/**
 * Make a single hire request
 */
async function makeHireRequest(requestId) {
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`Request ${requestId}: Attempting hire at ${timestamp}`);
    
    // Clean the token to remove any invalid characters
    const cleanedToken = cleanToken(TEST_CONFIG.CLIENT_TOKEN);
    
    const response = await axios.put(
      `${API_BASE_URL}/bids/${TEST_CONFIG.BID_ID}/hire`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${cleanedToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    console.log(`Request ${requestId}: SUCCESS - Status ${response.status}`);
    return {
      success: true,
      status: response.status,
      data: response.data,
      timestamp
    };
    
  } catch (error) {
    const status = error.response?.status || 'NETWORK_ERROR';
    const message = error.response?.data?.message || error.message;
    
    console.log(`Request ${requestId}: FAILED - Status ${status}, Message: ${message}`);
    
    return {
      success: false,
      status,
      error: message,
      timestamp
    };
  }
}

/**
 * Analyze and display test results
 */
function analyzeResults(results, duration) {
  console.log('\n' + '='.repeat(60));
  console.log('CONCURRENT HIRE TEST RESULTS');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`Total Duration: ${duration}ms`);
  console.log(`Total Requests: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  
  if (successful.length > 1) {
    console.log('\n RACE CONDITION DETECTED!');
    console.log('Multiple hire requests succeeded - this should not happen!');
  } else if (successful.length === 1) {
    console.log('\n RACE CONDITION PROTECTION WORKING!');
    console.log('Only one hire request succeeded as expected.');
  } else {
    console.log('\n NO SUCCESSFUL HIRES');
    console.log('All requests failed - check your test data and tokens.');
  }
  
  // Detailed results
  console.log('\n Detailed Results:');
  results.forEach(result => {
    const status = result.success ? 'succeed' : 'failed';
    const message = result.success ? 
      `SUCCESS (${result.status})` : 
      `FAILED (${result.status}): ${result.error}`;
    
    console.log(`   ${status} Request ${result.requestId}: ${message}`);
  });
  
  // Error analysis
  if (failed.length > 0) {
    console.log('\n Error Analysis:');
    const errorCounts = {};
    failed.forEach(result => {
      const errorKey = `${result.status}: ${result.error}`;
      errorCounts[errorKey] = (errorCounts[errorKey] || 0) + 1;
    });
    
    Object.entries(errorCounts).forEach(([error, count]) => {
      console.log(`   • ${error} (${count} times)`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Setup test data helper
 */
function printSetupInstructions() {
  console.log('SETUP INSTRUCTIONS:');
  console.log('1. Start your backend server (npm start)');
  console.log('2. Create a client user and get JWT token');
  console.log('3. Create a gig and get some bids');
  console.log('4. Update TEST_CONFIG with actual values:');
  console.log('   - CLIENT_TOKEN: JWT token of the gig owner');
  console.log('   - BID_ID: ID of a pending bid to test');
  console.log('5. Run: node tests/concurrency-test.js');
  console.log('');
}

// Main execution
if (require.main === module) {
  if (!TEST_CONFIG.CLIENT_TOKEN || TEST_CONFIG.CLIENT_TOKEN === 'your_client_jwt_token_here') {
    printSetupInstructions();
    process.exit(1);
  }
  
  // Validate token format
  try {
    cleanToken(TEST_CONFIG.CLIENT_TOKEN);
    console.log('Token format validated successfully');
  } catch (error) {
    console.error('Token validation failed:', error.message);
    console.log('\n Make sure your JWT token:');
    console.log('   - Has no line breaks or spaces');
    console.log('   - Has exactly 3 parts separated by dots');
    console.log('   - Is copied correctly from the login response');
    process.exit(1);
  }
  
  testConcurrentHire()
    .then(() => {
      console.log('\n Test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n Test failed with error:', error.message);
      process.exit(1);
    });
}

module.exports = { testConcurrentHire, makeHireRequest };