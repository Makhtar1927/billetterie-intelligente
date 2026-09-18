const http = require('http');

const postRequest = (url, data, headers = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
};

const test = async () => {
  try {
    console.log('⏳ Connexion en tant que client...');
    const loginRes = await postRequest('http://localhost:5000/api/auth/login', {
      email: 'client@billetterie.com',
      motDePasse: 'client123'
    });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
    }

    const token = loginRes.data.token;
    console.log('✅ Connecté. Token :', token.slice(0, 15) + '...');

    console.log('⏳ Tentative de souscription abonnement limité (10 voyages, 4000 FCFA)...');
    const subRes = await postRequest(
      'http://localhost:5000/api/abonnements',
      {
        type: 'limite',
        voyagesTotal: 10,
        prix: 4000
      },
      {
        Authorization: `Bearer ${token}`
      }
    );
    console.log('✅ Status de réponse :', subRes.status);
    console.log('✅ Réponse :', subRes.data);
  } catch (error) {
    console.error('❌ Erreur de test :', error.message);
  }
};

test();
