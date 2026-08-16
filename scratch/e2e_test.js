const BASE_URL = 'http://localhost:4000';
const API_URL = `${BASE_URL}/api/v1`;

async function runTests() {
  console.log('🚀 Starting CleanAI E2E API Verification Tests...\n');

  // 1. Health Checks
  console.log('--- 🩺 Testing Health & Readiness ---');
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log(`[Health Status]: ${healthRes.status} - Database: ${healthData.database}, Redis: ${healthData.redis}`);
    
    const versionRes = await fetch(`${API_URL}/version`);
    const versionData = await versionRes.json();
    console.log(`[Version Check]: ${versionRes.status} - Version: ${versionData.data.version}, Phase: ${versionData.data.phase}\n`);
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
    return;
  }

  // 2. Auth Flow (Register and Login)
  console.log('--- 🔑 Testing Authentication Flow ---');
  const uniqueEmail = `test.user.${Date.now()}@example.com`;
  const testUser = {
    email: uniqueEmail,
    phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    password: 'password123',
    firstName: 'E2E',
    lastName: 'TestUser',
    role: 'CUSTOMER'
  };

  let token = '';
  try {
    // Register
    console.log(`Registering user with email: ${uniqueEmail}`);
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();
    if (!regRes.ok) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }
    console.log('✅ Registration successful.');

    // Login
    console.log('Logging in...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    token = loginData.data.accessToken;
    console.log('✅ Login successful. Received Access Token.');
  } catch (err) {
    console.error('❌ Auth flow failed:', err.message);
    return;
  }

  // 3. User Profile Info
  console.log('\n--- 👤 Testing Profile Retrieval ---');
  try {
    const profileRes = await fetch(`${API_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profileData = await profileRes.json();
    if (!profileRes.ok) {
      throw new Error(`Profile fetch failed: ${JSON.stringify(profileData)}`);
    }
    console.log(`✅ Profile retrieved. User ID: ${profileData.data.id}, Name: ${profileData.data.firstName} ${profileData.data.lastName}`);
  } catch (err) {
    console.error('❌ Profile check failed:', err.message);
  }

  // 4. Services List
  console.log('\n--- 🛠️ Testing Service Catalog ---');
  try {
    const servicesRes = await fetch(`${API_URL}/services`);
    const servicesData = await servicesRes.json();
    if (!servicesRes.ok) {
      throw new Error(`Services fetch failed: ${JSON.stringify(servicesData)}`);
    }
    console.log(`✅ Retrieved service catalog. Found ${servicesData.data.length} services.`);
    servicesData.data.slice(0, 3).forEach(s => {
      console.log(`   - ${s.name} (Base Price: $${s.basePrice})`);
    });
  } catch (err) {
    console.error('❌ Services check failed:', err.message);
  }

  console.log('\n🎉 E2E Verification Finished successfully!');
}

runTests();
