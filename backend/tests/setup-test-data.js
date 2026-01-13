/**
 * Test Data Setup Script
 * Creates test users, gigs, and bids for concurrent testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Gig = require('../models/Gig');
const Bid = require('../models/Bid');
const { GIG_STATUS, BID_STATUS } = require('../constants');

/**
 * Connect to database
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Create test users
 */
async function createTestUsers() {
  console.log('Creating test users...');
  
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  // Create client user
  const client = new User({
    name: 'Test Client',
    email: 'client@test.com',
    password: hashedPassword,
    role: 'client',
    profile: {
      bio: 'Test client for concurrent testing',
      skills: [],
      hourlyRate: 0
    }
  });
  
  // Create freelancer users
  const freelancer1 = new User({
    name: 'Freelancer One',
    email: 'freelancer1@test.com',
    password: hashedPassword,
    role: 'freelancer',
    profile: {
      bio: 'Test freelancer 1',
      skills: ['JavaScript', 'React', 'Node.js'],
      hourlyRate: 50
    }
  });
  
  const freelancer2 = new User({
    name: 'Freelancer Two',
    email: 'freelancer2@test.com',
    password: hashedPassword,
    role: 'freelancer',
    profile: {
      bio: 'Test freelancer 2',
      skills: ['Python', 'Django', 'PostgreSQL'],
      hourlyRate: 60
    }
  });
  
  const freelancer3 = new User({
    name: 'Freelancer Three',
    email: 'freelancer3@test.com',
    password: hashedPassword,
    role: 'freelancer',
    profile: {
      bio: 'Test freelancer 3',
      skills: ['Vue.js', 'PHP', 'MySQL'],
      hourlyRate: 45
    }
  });
  
  // Save users
  await User.deleteMany({ email: { $in: ['client@test.com', 'freelancer1@test.com', 'freelancer2@test.com', 'freelancer3@test.com'] } });
  
  const savedClient = await client.save();
  const savedFreelancer1 = await freelancer1.save();
  const savedFreelancer2 = await freelancer2.save();
  const savedFreelancer3 = await freelancer3.save();
  
  console.log('Test users created successfully');
  
  return {
    client: savedClient,
    freelancers: [savedFreelancer1, savedFreelancer2, savedFreelancer3]
  };
}

/**
 * Create test gig
 */
async function createTestGig(client) {
  console.log('Creating test gig...');
  
  const gig = new Gig({
    title: 'Test Gig for Concurrent Hiring',
    description: 'This is a test gig created for testing concurrent hire functionality. Multiple freelancers will bid on this project.',
    category: 'web-development',
    budget: {
      min: 500,
      max: 1000
    },
    skills: ['JavaScript', 'React', 'Node.js'],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    client: client._id,
    status: GIG_STATUS.OPEN
  });
  
  // Remove existing test gig if any
  await Gig.deleteMany({ title: 'Test Gig for Concurrent Hiring' });
  
  const savedGig = await gig.save();
  console.log('Test gig created successfully');
  
  return savedGig;
}

/**
 * Create test bids
 */
async function createTestBids(gig, freelancers) {
  console.log('Creating test bids...');
  
  const bids = [
    {
      gig: gig._id,
      freelancer: freelancers[0]._id,
      bidAmount: 750,
      deliveryTime: 14,
      proposal: 'I can deliver this project using React and Node.js with high quality code and on-time delivery.',
      status: BID_STATUS.PENDING
    },
    {
      gig: gig._id,
      freelancer: freelancers[1]._id,
      bidAmount: 650,
      deliveryTime: 10,
      proposal: 'I have extensive experience in web development and can complete this project efficiently.',
      status: BID_STATUS.PENDING
    },
    {
      gig: gig._id,
      freelancer: freelancers[2]._id,
      bidAmount: 800,
      deliveryTime: 12,
      proposal: 'Quality work guaranteed with modern technologies and best practices.',
      status: BID_STATUS.PENDING
    }
  ];
  
  // Remove existing test bids
  await Bid.deleteMany({ gig: gig._id });
  
  const savedBids = await Bid.insertMany(bids);
  console.log('Test bids created successfully');
  
  return savedBids;
}

/**
 * Generate JWT token for testing
 */
function generateTestToken(user) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Display test information
 */
function displayTestInfo(client, gig, bids, token) {
  console.log('\n' + '='.repeat(60));
  console.log('TEST DATA SETUP COMPLETE');
  console.log('='.repeat(60));
  
  console.log('\nTest Configuration:');
  console.log(`Client ID: ${client._id}`);
  console.log(`Client Email: ${client.email}`);
  console.log(`Gig ID: ${gig._id}`);
  console.log(`Gig Title: ${gig.title}`);
  
  console.log('\nAvailable Bids:');
  bids.forEach((bid, index) => {
    console.log(`Bid ${index + 1}: ${bid._id} - $${bid.bidAmount} (${bid.deliveryTime} days)`);
  });
  
  console.log('\nJWT Token (valid for 24h):');
  console.log(token);
  
  console.log('\nUpdate your test files with these values:');
  console.log(`CLIENT_TOKEN: "${token}"`);
  console.log(`BID_ID: "${bids[0]._id}" // Use any bid ID from above`);
  
  console.log('\nReady to test! Run:');
  console.log('node tests/concurrency-test.js');
  console.log('node tests/load-test.js');
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Main setup function
 */
async function setupTestData() {
  try {
    await connectDB();
    
    console.log('🚀 Setting up test data for concurrent transaction testing...\n');
    
    // Create test users
    const { client, freelancers } = await createTestUsers();
    
    // Create test gig
    const gig = await createTestGig(client);
    
    // Create test bids
    const bids = await createTestBids(gig, freelancers);
    
    // Generate JWT token
    const token = generateTestToken(client);
    
    // Display test information
    displayTestInfo(client, gig, bids, token);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

/**
 * Cleanup function
 */
async function cleanupTestData() {
  try {
    await connectDB();
    
    console.log('🧹 Cleaning up test data...');
    
    // Remove test data
    await User.deleteMany({ email: { $regex: '@test\.com$' } });
    await Gig.deleteMany({ title: 'Test Gig for Concurrent Hiring' });
    await Bid.deleteMany({}); // Remove all bids (they reference test gigs)
    
    console.log('✅ Test data cleaned up successfully');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'cleanup') {
    cleanupTestData();
  } else {
    setupTestData();
  }
}

module.exports = {
  setupTestData,
  cleanupTestData,
  createTestUsers,
  createTestGig,
  createTestBids
};