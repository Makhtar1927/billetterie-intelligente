// tests/run_critical_tests.js
// Script d'exécution automatique des tests critiques du service billetterie / abonnements

const BASE_URL = 'http://localhost:5001/api';
const GATEWAY_URL = 'http://localhost:5000/api';

const headers = (userId = 'client-test-uuid', role = 'client') => ({
  'Content-Type': 'application/json',
  'x-user-id': userId,
  'x-user-role': role,
});

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedTests++;
  }
}

async function run() {
  console.log('====================================================');
  console.log('  DÉBUT DES TESTS CRITIQUES - SERVICE BILLETTERIE   ');
  console.log('====================================================\n');

  // --- TEST 1 : Création d'un ticket simple ---
  console.log('--- TEST 1 : Achat d\'un ticket simple ---');
  let ticketSimple;
  try {
    const res = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: headers('user-test-01', 'client'),
      body: JSON.stringify({
        typeTicket: 'simple',
        prix: 500,
      }),
    });
    const json = await res.json();
    ticketSimple = json.data;
    assert(res.ok && json.success && ticketSimple, 'Création du ticket simple réussie');
    assert(ticketSimple && ticketSimple.qrCodeData, 'Données QR Code générées et présentes');
  } catch (err) {
    assert(false, `Erreur lors de la création du ticket : ${err.message}`);
  }

  // --- TEST 2 : Scan valide du ticket simple ---
  console.log('\n--- TEST 2 : Scan valide du ticket simple ---');
  try {
    const res = await fetch(`${BASE_URL}/voyages/scan`, {
      method: 'POST',
      headers: headers('agent-test-01', 'agent'),
      body: JSON.stringify({
        qrCodeData: ticketSimple.qrCodeData,
        lieu: 'Station Test Gare',
      }),
    });
    const data = await res.json();
    assert(res.ok && data.statut === 'autorise', 'Le premier scan est autorisé');
    assert(data.voyagesRestants === 0, 'Le solde restant passe à 0');
  } catch (err) {
    assert(false, `Erreur scan 1 : ${err.message}`);
  }

  // --- TEST 3 : Double scan du ticket simple (déjà utilisé) ---
  console.log('\n--- TEST 3 : Double scan (Ticket déjà consommé) ---');
  try {
    const res = await fetch(`${BASE_URL}/voyages/scan`, {
      method: 'POST',
      headers: headers('agent-test-01', 'agent'),
      body: JSON.stringify({
        qrCodeData: ticketSimple.qrCodeData,
        lieu: 'Station Test Gare',
      }),
    });
    const data = await res.json();
    assert(data.statut === 'refuse', 'Le second scan est bien refusé');
    assert(data.motif && data.motif.includes('déjà utilisé'), `Motif signale l'épuisement du voyage unique : "${data.motif}"`);
  } catch (err) {
    assert(false, `Erreur scan double : ${err.message}`);
  }

  // --- TEST 4 : Scan d'un QR code falsifié ---
  console.log('\n--- TEST 4 : Scan avec falsification de la signature HMAC ---');
  try {
    const fakedData = JSON.stringify({
      id: 'fake-ticket-uuid',
      sig: 'deadbeefcafebabe1234567890abcdefdeadbeefcafebabe1234567890abcdef',
    });
    const res = await fetch(`${BASE_URL}/voyages/scan`, {
      method: 'POST',
      headers: headers('agent-test-01', 'agent'),
      body: JSON.stringify({
        qrCodeData: fakedData,
        lieu: 'Contrôle Mobile',
      }),
    });
    const data = await res.json();
    assert(res.status === 403, `Code HTTP 403 retourné (obtenu: ${res.status})`);
    assert(data.statut === 'refuse', 'Statut refusé pour signature invalide');
    assert(data.motif && data.motif.includes('falsifié'), `Motif signale la falsification : "${data.motif}"`);
  } catch (err) {
    assert(false, `Erreur test signature falsifiée : ${err.message}`);
  }

  // --- TEST 5 : Suspension d'un ticket et tentative de scan ---
  console.log('\n--- TEST 5 : Suspension de titre et tentative de scan ---');
  let ticketSuspendu;
  try {
    // 5a. Créer un ticket
    const createRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: headers('user-test-02', 'client'),
      body: JSON.stringify({ typeTicket: 'simple', prix: 500 }),
    });
    const createData = await createRes.json();
    ticketSuspendu = createData.data;

    // 5b. Suspendre le ticket
    const patchRes = await fetch(`${BASE_URL}/tickets/${ticketSuspendu.id}/statut`, {
      method: 'PATCH',
      headers: headers('admin-test', 'admin'),
      body: JSON.stringify({ statut: 'suspendu' }),
    });
    const patchData = await patchRes.json();
    assert(patchRes.ok && patchData.data && patchData.data.statut === 'suspendu', 'Ticket passé au statut suspendu');

    // 5c. Tenter de scanner
    const scanRes = await fetch(`${BASE_URL}/voyages/scan`, {
      method: 'POST',
      headers: headers('agent-test-01', 'agent'),
      body: JSON.stringify({
        qrCodeData: ticketSuspendu.qrCodeData,
        lieu: 'Porte Sud',
      }),
    });
    const scanData = await scanRes.json();
    assert(scanData.statut === 'refuse', 'Le scan d\'un ticket suspendu est refusé');
    assert(scanData.motif && scanData.motif.includes('suspendu'), `Motif signale la suspension : "${scanData.motif}"`);
  } catch (err) {
    assert(false, `Erreur test suspension : ${err.message}`);
  }

  // --- TEST 6 : Réactivation d'un ticket suspendu et validation ---
  console.log('\n--- TEST 6 : Réactivation du titre et ré-essai du scan ---');
  try {
    const patchRes = await fetch(`${BASE_URL}/tickets/${ticketSuspendu.id}/statut`, {
      method: 'PATCH',
      headers: headers('admin-test', 'admin'),
      body: JSON.stringify({ statut: 'valide' }),
    });
    const patchData = await patchRes.json();
    assert(patchRes.ok && patchData.data && patchData.data.statut === 'valide', 'Ticket réactivé au statut valide');

    const scanRes = await fetch(`${BASE_URL}/voyages/scan`, {
      method: 'POST',
      headers: headers('agent-test-01', 'agent'),
      body: JSON.stringify({
        qrCodeData: ticketSuspendu.qrCodeData,
        lieu: 'Porte Sud',
      }),
    });
    const scanData = await scanRes.json();
    assert(scanData.statut === 'autorise', 'Le scan après réactivation est autorisé');
  } catch (err) {
    assert(false, `Erreur test réactivation : ${err.message}`);
  }

  // --- TEST 7 : Cycle de vie d'un Abonnement Limité (2 voyages) ---
  console.log('\n--- TEST 7 : Abonnement limité (2 voyages) ---');
  try {
    // 7a. Souscrire
    const subRes = await fetch(`${BASE_URL}/abonnements`, {
      method: 'POST',
      headers: headers('user-abonne-01', 'client'),
      body: JSON.stringify({
        type: 'limite',
        voyagesTotal: 2,
        prix: 1000,
      }),
    });
    const subJson = await subRes.json();
    assert(subRes.ok && subJson.success && subJson.data && subJson.data.ticket, 'Souscription abonnement limité (2 voyages) réussie');
    const qrData = subJson.data.ticket.qrCodeData;

    // Scan 1
    const s1 = await (await fetch(`${BASE_URL}/voyages/scan`, {
      method: 'POST',
      headers: headers('agent-01', 'agent'),
      body: JSON.stringify({ qrCodeData: qrData }),
    })).json();
    assert(s1.statut === 'autorise' && s1.voyagesRestants === 1, 'Scan 1/2 autorisé, solde = 1 voyage');

    // Scan 2
    const s2 = await (await fetch(`${BASE_URL}/voyages/scan`, {
      method: 'POST',
      headers: headers('agent-01', 'agent'),
      body: JSON.stringify({ qrCodeData: qrData }),
    })).json();
    assert(s2.statut === 'autorise' && s2.voyagesRestants === 0, 'Scan 2/2 autorisé, solde = 0 voyage');

    // Scan 3 (épuisé)
    const s3 = await (await fetch(`${BASE_URL}/voyages/scan`, {
      method: 'POST',
      headers: headers('agent-01', 'agent'),
      body: JSON.stringify({ qrCodeData: qrData }),
    })).json();
    assert(s3.statut === 'refuse', 'Scan 3 refusé car solde épuisé');
    assert(s3.motif && s3.motif.includes('épuisé'), `Motif signale l'épuisement : "${s3.motif}"`);
  } catch (err) {
    assert(false, `Erreur test abonnement limité : ${err.message}`);
  }

  // --- TEST 8 : Concurrence / Anti-double dépense (Race Condition) ---
  console.log('\n--- TEST 8 : Test de Concurrence (2 scans simultanés d\'1 ticket simple) ---');
  try {
    // Créer un ticket frais
    const freshTicketRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: headers('user-race-test', 'client'),
      body: JSON.stringify({ typeTicket: 'simple', prix: 500 }),
    });
    const freshTicket = (await freshTicketRes.json()).data;

    // Lancer 2 requêtes simultanées
    const req1 = fetch(`${BASE_URL}/voyages/scan`, {
      method: 'POST',
      headers: headers('agent-race-1', 'agent'),
      body: JSON.stringify({ qrCodeData: freshTicket.qrCodeData, lieu: 'Portique 1' }),
    }).then(r => r.json());

    const req2 = fetch(`${BASE_URL}/voyages/scan`, {
      method: 'POST',
      headers: headers('agent-race-2', 'agent'),
      body: JSON.stringify({ qrCodeData: freshTicket.qrCodeData, lieu: 'Portique 2' }),
    }).then(r => r.json());

    const [res1, res2] = await Promise.all([req1, req2]);

    const autorises = [res1, res2].filter(r => r.statut === 'autorise').length;
    const refuses = [res1, res2].filter(r => r.statut === 'refuse').length;

    assert(autorises === 1, `Verrouillage transactionnel : Exactement 1 seul scan autorisé (obtenu: ${autorises})`);
    assert(refuses === 1, `Verrouillage transactionnel : Exactement 1 scan refusé (obtenu: ${refuses})`);
  } catch (err) {
    assert(false, `Erreur test concurrence : ${err.message}`);
  }

  // --- TEST 9 : Vérification des logs d'audit ---
  console.log('\n--- TEST 9 : Vérification des logs d\'audit ---');
  try {
    const auditRes = await fetch(`${BASE_URL}/audits?limit=5`, {
      method: 'GET',
      headers: headers('admin-01', 'admin'),
    });
    const auditJson = await auditRes.json();
    assert(auditRes.ok && Array.isArray(auditJson.data), 'Route GET /api/audits répond avec la liste des audits');
    assert(auditJson.data.length > 0, `Au moins 1 log d'audit enregistré (nombre: ${auditJson.data.length})`);
    const lastAction = auditJson.data[0] ? auditJson.data[0].action : 'aucun';
    console.log(`    Dernière action d'audit journalisée : "${lastAction}"`);
  } catch (err) {
    assert(false, `Erreur test audit : ${err.message}`);
  }

  // --- TEST 10 : Vérification des statistiques ---
  console.log('\n--- TEST 10 : Statistiques globales tickets et voyages ---');
  try {
    const tStatsJson = await (await fetch(`${BASE_URL}/tickets/stats`, { headers: headers('admin-01', 'admin') })).json();
    const vStatsJson = await (await fetch(`${BASE_URL}/voyages/stats`, { headers: headers('admin-01', 'admin') })).json();

    const tStats = tStatsJson.data;
    const vStats = vStatsJson.data;

    assert(tStats && tStats.total !== undefined && tStats.valide !== undefined, 'Statistiques tickets complètes');
    assert(vStats && vStats.total !== undefined && vStats.autorise !== undefined && vStats.refuse !== undefined, 'Statistiques voyages complètes');
    console.log(`    Stats Billets -> Total: ${tStats.total}, Valides: ${tStats.valide}, Utilisés: ${tStats.utilise}, Suspendus: ${tStats.suspendu}`);
    console.log(`    Stats Voyages -> Total: ${vStats.total}, Autorisés: ${vStats.autorise}, Refusés: ${vStats.refuse}`);
  } catch (err) {
    assert(false, `Erreur test statistiques : ${err.message}`);
  }

  // --- TEST 11 : Gateway Backend (Port 5000) ---
  console.log('\n--- TEST 11 : Test de la Passerelle Gateway (Port 5000) ---');
  try {
    const healthRes = await fetch(`${GATEWAY_URL}/health`);
    if (healthRes.ok) {
      assert(true, 'Gateway backend en ligne sur port 5000');
    } else {
      console.log(`    Info Gateway status: ${healthRes.status}`);
    }
  } catch (err) {
    console.log(`    Passerelle port 5000 : ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`  RÉSULTATS : ${passedTests}/${totalTests} TESTS RÉUSSIS (${failedTests} ÉCHECS)`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

run();
