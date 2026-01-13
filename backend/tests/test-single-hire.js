/**
 * Single Hire Test - Validates basic hire functionality
 * 
 * This test performs a single hire request and checks the resulting database state.
 * Use this to verify basic hire functionality before testing concurrency.
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Configuration - Update these with actual values from setup-test-data.js
const TEST_CONFIG = {
  CLIENT_TOKEN: 'your_jwt_token_here', // Get from setup-test-data.js or get-token.js
  BID_ID: 'your_bid_id_here',         // Get from setup-test-data.js
  GIG_ID: 'your_gig_id_here'          // Get from setup-test-data.js
};

/**
 * Test a single hire request
 */
async function testSingleHire() {
  try {
    console.log('🎯 Testing single hire request...');
    console.log(`Bid ID: ${TEST_CONFIG.BID_ID}`);
    
    const response = await axios.put(
      `${API_BASE_URL}/bids/${TEST_CONFIG.BID_ID}/hire`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.CLIENT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Hire successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.log('❌ Hire failed:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
    
    if (error.response?.status === 400) {
      console.log('💡 This might be expected if the gig is already hired or bid is processed');
    }
    
    return false;
  }
}

/**
 * Check bid and gig status after hire attempt
 */
async function checkBidStatus() {
  try {
    console.log('\n🔍 Checking bid status after hire...');
    
    const response = await axios.get(
      `${API_BASE_URL}/bids/gig/${TEST_CONFIG.GIG_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.CLIENT_TOKEN}`
        }
      }
    );
    
    console.log('📊 Bid statuses:');
    response.data.bids.forEach((bid, index) => {
      const status = bid.status === 'accepted' ? '✅' : 
                    bid.status === 'rejected' ? '❌' : '⏳';
      
      console.log(`${status} Bid ${index + 1}: ${bid._id}`);
      console.log(`   Status: ${bid.status} | Amount: $${bid.bidAmount} | Freelancer: ${bid.freelancer.name}`);
      
      if (bid.status === 'accepted') {
        console.log(`   Accepted at: ${bid.acceptedAt}`);
      }
      if (bid.status === 'rejected') {
        console.log(`   Rejected: ${bid.rejectionReason}`);
      }
    });
    
    // Summary
    const accepted = response.data.bids.filter(b => b.status === 'accepted').length;
    const rejected = response.data.bids.filter(b => b.status === 'rejected').length;
    const pending = response.data.bids.filter(b => b.status === 'pending').length;
    
    console.log('\n📈 Summary:');
    console.log(`   Accepted: ${accepted} | Rejected: ${rejected} | Pending: ${pending}`);
    
    if (accepted === 1) {
      console.log('✅ Perfect! Exactly one bid accepted.');
    } else if (accepted > 1) {
      console.log('🚨 Issue! Multiple bids accepted - race condition not working.');
    } else {
      console.log('⚠️  No bids accepted yet.');
    }
    
  } catch (error) {
    console.log('❌ Failed to check bid status:', error.response?.data?.message);
  }
}

/**
 * Print setup instructions
 */
function printSetupInstructions() {
  console.log('📋 SETUP INSTRUCTIONS:');
  console.log('1. Run: node tests/setup-test-data.js');
  console.log('2. Copy the CLIENT_TOKEN, BID_ID, and GIG_ID from the output');
  console.log('3. Update TEST_CONFIG in this file with those values');
  console.log('4. Run: node tests/test-single-hire.js');
  console.log('');
  console.log('💡 Or use: node tests/get-token.js client@test.com password123');
  console.log('   to get a fresh token for existing test data');
}

// Main execution
if (require.main === module) {
  if (TEST_CONFIG.CLIENT_TOKEN === 'your_jwt_token_here') {
    printSetupInstructions();
    process.exit(1);
  }
  
  console.log('🚀 Starting Single Hire Test...\n');
  
  testSingleHire()
    .then(() => checkBidStatus())
    .then(() => {
      console.log('\n🏁 Single hire test completed!');
      console.log('\n💡 Next steps:');
      console.log('   - Run concurrent test: node tests/concurrency-test.js');
      console.log('   - Run load test: node tests/load-test.js');
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error.message);
    });
}

module.exports = { testSingleHire, checkBidStatus };