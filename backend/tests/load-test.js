/**
 * Load Test Script for Hire Endpoint
 * Tests system behavior under high concurrent load
 */

const axios = require('axios');

// Configuration
const LOAD_TEST_CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  CLIENT_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NjUyM2MxZjUyZGM5NjNjZWJiMDFhZiIsImlhdCI6MTc2ODIzNTk5NSwiZXhwIjoxNzcwODI3OTk1fQ.vg2DFCfY3EZ2LFky3xmJn5dISoHmEpmMOSNUsfhF-sA',
  BID_ID: '696523c1f52dc963cebb01c1',
  
  // Load test parameters
  TOTAL_REQUESTS: 20,
  CONCURRENT_BATCHES: 4,
  BATCH_SIZE: 5,
  BATCH_DELAY_MS: 100,
  REQUEST_TIMEOUT_MS: 5000
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
 * Run load test with batched concurrent requests
 */
async function runLoadTest() {
  console.log('Starting Load Test for Hire Endpoint...\n');
  
  const allResults = [];
  const startTime = Date.now();
  
  // Run requests in batches to simulate realistic load
  for (let batch = 0; batch < LOAD_TEST_CONFIG.CONCURRENT_BATCHES; batch++) {
    console.log(`📦 Batch ${batch + 1}/${LOAD_TEST_CONFIG.CONCURRENT_BATCHES}`);
    
    const batchPromises = [];
    
    // Create batch of concurrent requests
    for (let i = 0; i < LOAD_TEST_CONFIG.BATCH_SIZE; i++) {
      const requestId = batch * LOAD_TEST_CONFIG.BATCH_SIZE + i + 1;
      const promise = makeTimedHireRequest(requestId);
      batchPromises.push(promise);
    }
    
    // Execute batch concurrently
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Process batch results
    batchResults.forEach((result, index) => {
      const requestId = batch * LOAD_TEST_CONFIG.BATCH_SIZE + index + 1;
      if (result.status === 'fulfilled') {
        allResults.push({ requestId, ...result.value });
      } else {
        allResults.push({ 
          requestId, 
          success: false, 
          error: result.reason.message,
          responseTime: 0
        });
      }
    });
    
    // Delay between batches
    if (batch < LOAD_TEST_CONFIG.CONCURRENT_BATCHES - 1) {
      await new Promise(resolve => setTimeout(resolve, LOAD_TEST_CONFIG.BATCH_DELAY_MS));
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  // Analyze load test results
  analyzeLoadTestResults(allResults, totalTime);
}

/**
 * Make a timed hire request
 */
async function makeTimedHireRequest(requestId) {
  const startTime = Date.now();
  
  try {
    // Clean the token to remove any invalid characters
    const cleanedToken = cleanToken(LOAD_TEST_CONFIG.CLIENT_TOKEN);
    
    const response = await axios.put(
      `${LOAD_TEST_CONFIG.API_BASE_URL}/bids/${LOAD_TEST_CONFIG.BID_ID}/hire`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${cleanedToken}`,
          'Content-Type': 'application/json'
        },
        timeout: LOAD_TEST_CONFIG.REQUEST_TIMEOUT_MS
      }
    );
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      status: response.status,
      responseTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      status: error.response?.status || 'TIMEOUT',
      error: error.response?.data?.message || error.message,
      responseTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Analyze load test results
 */
function analyzeLoadTestResults(results, totalTime) {
  console.log('\n' + '='.repeat(70));
  console.log('LOAD TEST RESULTS');
  console.log('='.repeat(70));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const responseTimes = results.map(r => r.responseTime).filter(t => t > 0);
  
  // Basic metrics
  console.log(`Total Test Duration: ${totalTime}ms`);
  console.log(`Total Requests: ${results.length}`);
  console.log(`Successful: ${successful.length} (${(successful.length/results.length*100).toFixed(1)}%)`);
  console.log(`Failed: ${failed.length} (${(failed.length/results.length*100).toFixed(1)}%)`);
  
  // Performance metrics
  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const medianResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)];
    
    console.log('\nPerformance Metrics:');
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   Median Response Time: ${medianResponseTime}ms`);
    console.log(`   Min Response Time: ${minResponseTime}ms`);
    console.log(`   Max Response Time: ${maxResponseTime}ms`);
    
    // Throughput
    const requestsPerSecond = (results.length / totalTime * 1000).toFixed(2);
    console.log(`   Throughput: ${requestsPerSecond} requests/second`);
  }
  
  // Race condition analysis
  if (successful.length > 1) {
    console.log('\nPOTENTIAL RACE CONDITION ISSUE!');
    console.log(`${successful.length} requests succeeded - only 1 should succeed for the same bid.`);
  } else if (successful.length === 1) {
    console.log('\nRACE CONDITION PROTECTION WORKING!');
    console.log('Only one request succeeded as expected.');
  }
  
  // Error distribution
  if (failed.length > 0) {
    console.log('\nError Distribution:');
    const errorStats = {};
    failed.forEach(result => {
      const errorKey = `${result.status}`;
      if (!errorStats[errorKey]) {
        errorStats[errorKey] = { count: 0, examples: [] };
      }
      errorStats[errorKey].count++;
      if (errorStats[errorKey].examples.length < 3) {
        errorStats[errorKey].examples.push(result.error);
      }
    });
    
    Object.entries(errorStats).forEach(([status, stats]) => {
      console.log(`   ${status}: ${stats.count} requests`);
      stats.examples.forEach(example => {
        console.log(`     • ${example}`);
      });
    });
  }
  
  // Response time distribution
  if (responseTimes.length > 0) {
    console.log('\nResponse Time Distribution:');
    const buckets = {
      'Under 100ms': responseTimes.filter(t => t < 100).length,
      '100-500ms': responseTimes.filter(t => t >= 100 && t < 500).length,
      '500ms-1s': responseTimes.filter(t => t >= 500 && t < 1000).length,
      '1s-2s': responseTimes.filter(t => t >= 1000 && t < 2000).length,
      'Over 2s': responseTimes.filter(t => t >= 2000).length
    };
    
    Object.entries(buckets).forEach(([range, count]) => {
      const percentage = (count / responseTimes.length * 100).toFixed(1);
      console.log(`   ${range}: ${count} requests (${percentage}%)`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
}

// Main execution
if (require.main === module) {
  if (!LOAD_TEST_CONFIG.CLIENT_TOKEN || LOAD_TEST_CONFIG.CLIENT_TOKEN === 'your_client_jwt_token_here') {
    console.log('Please update LOAD_TEST_CONFIG with actual CLIENT_TOKEN and BID_ID');
    process.exit(1);
  }
  
  runLoadTest()
    .then(() => {
      console.log('\nLoad test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nLoad test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runLoadTest };