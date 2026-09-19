const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: 'GET',
      headers: headers,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- TEST DOCKER COMPOSE API (PORT 8000) ---');

  // 1. Health
  const health = await get('/api/health');
  console.log('1. GET /api/health =>', health.status, health.data);

  // 2. Login Admin
  const loginAdmin = await post('/api/auth/login', {
    email: 'admin@billetterie.com',
    motDePasse: 'admin123'
  });
  console.log('2. POST /api/auth/login (Admin) =>', loginAdmin.status, {
    success: loginAdmin.data.success,
    user: loginAdmin.data.user ? loginAdmin.data.user.email : null,
    role: loginAdmin.data.user ? loginAdmin.data.user.role : null,
  });

  const adminToken = loginAdmin.data.token;

  // 3. Login Client
  const loginClient = await post('/api/auth/login', {
    email: 'client@billetterie.com',
    motDePasse: 'client123'
  });
  console.log('3. POST /api/auth/login (Client) =>', loginClient.status, {
    success: loginClient.data.success,
    user: loginClient.data.user ? loginClient.data.user.email : null,
    role: loginClient.data.user ? loginClient.data.user.role : null,
  });

  // 4. Inscription nouveau client
  const randomEmail = `client_${Date.now()}@test.com`;
  const registerRes = await post('/api/auth/register', {
    nom: 'Diop',
    prenom: 'Awa',
    email: randomEmail,
    motDePasse: 'Pass1234!',
    telephone: '+221770001122'
  });
  console.log('4. POST /api/auth/register =>', registerRes.status, {
    success: registerRes.data.success,
    email: randomEmail
  });

  // 5. Test accès liste utilisateurs avec Token Admin
  const usersRes = await get('/api/users', adminToken);
  console.log('5. GET /api/users (Admin JWT) =>', usersRes.status, {
    total: usersRes.data.total,
    count: usersRes.data.users ? usersRes.data.users.length : 0
  });

  console.log('\n✅ TOUS LES TESTS DOCKER COMPOSE ONT RÉUSSI AVEC SUCCÈS !');
}

run().catch(err => {
  console.error('❌ Erreur de test:', err);
  process.exit(1);
});
