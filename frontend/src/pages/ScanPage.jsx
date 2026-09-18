import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { scanQRCode } from '../api/userService';
import toast from 'react-hot-toast';

const SCANNER_ID = 'agent-qr-scanner';

export default function ScanPage() {
  const [scanning,       setScanning]       = useState(false);
  const [result,         setResult]         = useState(null);
  const [manual,         setManual]         = useState('');
  const [loading,        setLoading]        = useState(false);
  const [cameras,        setCameras]        = useState([]);     // Liste des caméras dispo
  const [selectedCamera, setSelectedCamera] = useState('');    // ID caméra choisie
  const [camError,       setCamError]       = useState('');    // Erreur d'accès caméra
  const scannerRef = useRef(null);

  const startScanner = async () => {
    try {
      // Vérifier si le navigateur supporte getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Votre navigateur ne supporte pas l\'accès à la caméra. Utilisez Chrome ou Firefox.');
        return;
      }

      setCamError('');
      setResult(null);

      // Si la liste des caméras est vide, la charger d'abord (ceci demande la permission)
      let activeCameraId = selectedCamera;
      if (!activeCameraId) {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
            // Déterminer la caméra par défaut (préférer la caméra arrière)
            const rearCam = devices.find(d =>
              d.label?.toLowerCase().includes('back') ||
              d.label?.toLowerCase().includes('rear') ||
              d.label?.toLowerCase().includes('environment') ||
              d.label?.toLowerCase().includes('arrière')
            );
            activeCameraId = rearCam ? rearCam.id : devices[0].id;
            setSelectedCamera(activeCameraId);
          } else {
            setCamError('Aucune caméra détectée sur cet appareil. Utilisez la saisie manuelle.');
            toast.error('Aucune caméra détectée.');
            return;
          }
        } catch (err) {
          setCamError('Accès à la caméra refusé. Veuillez l\'autoriser dans les paramètres de votre navigateur (cliquez sur le cadenas à côté de l\'URL).');
          toast.error('Accès caméra refusé.');
          return;
        }
      }

      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;
      setScanning(true);

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      const onScan = async (decodedText) => {
        await scanner.stop().catch(() => {});
        setScanning(false);
        await processQR(decodedText);
      };

      // Tenter de démarrer avec la caméra sélectionnée
      try {
        await scanner.start(activeCameraId, config, onScan, () => {});
      } catch (err) {
        console.warn("Échec du démarrage de la caméra sélectionnée, fallback automatique...", err);
        // Fallback automatique : caméra arrière (mobile), puis caméra avant (PC)
        try {
          await scanner.start({ facingMode: 'environment' }, config, onScan, () => {});
        } catch {
          try {
            await scanner.start({ facingMode: 'user' }, config, onScan, () => {});
          } catch (innerErr) {
            throw innerErr;
          }
        }
      }
    } catch (err) {
      setScanning(false);
      const msg = err?.message || '';
      if (msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('denied') || msg.includes('refusé')) {
        setCamError('Accès à la caméra refusé. Veuillez l\'autoriser dans les paramètres de votre navigateur (cliquez sur le cadenas à gauche de l\'URL).');
        toast.error('Permission caméra refusée.');
      } else if (msg.includes('NotFound') || msg.includes('Requested device not found')) {
        setCamError('Aucune caméra détectée sur cet appareil. Utilisez la saisie manuelle.');
        toast.error('Caméra non détectée.');
      } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setCamError('La caméra nécessite une connexion sécurisée HTTPS. Utilisez localhost ou HTTPS.');
        toast.error('HTTPS requis pour la caméra.');
      } else {
        setCamError('Impossible d\'accéder à la caméra. Vérifiez les permissions de votre navigateur.');
        toast.error('Erreur caméra.');
      }
    }
  };


  const stopScanner = async () => {
    if (scannerRef.current && scanning) {
      await scannerRef.current.stop().catch(() => {});
      setScanning(false);
    }
  };

  const processQR = async (qrData) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await scanQRCode(qrData);
      setResult({ statut: 'autorise', client: res.data.client, type: res.data.type });
    } catch (err) {
      const data = err.response?.data;
      setResult({ statut: 'refuse', motif: data?.motif || 'Erreur de validation.' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = (e) => {
    e.preventDefault();
    if (!manual.trim()) return;
    processQR(manual.trim());
    setManual('');
  };

  useEffect(() => () => { stopScanner(); }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Scanner un QR Code</h1>
          <p className="page-subtitle">Validez les billets et abonnements des voyageurs</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

        {/* Scanner caméra */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)' }}>photo_camera</span>
            Caméra
          </h3>

          {/* Sélection de caméra si plus d'une caméra détectée */}
          {cameras.length > 1 && !scanning && (
            <div style={{ marginBottom: 16, textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Choisir la caméra :</label>
              <select
                className="form-input"
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                style={{ fontSize: '0.9rem', padding: '8px 12px', width: '100%', borderRadius: 8 }}
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Caméra ${cameras.indexOf(cam) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {camError && !scanning && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 16, textAlign: 'left', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.06)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.15)' }}>
              {camError}
            </div>
          )}

          <div id={SCANNER_ID} style={{ borderRadius: 12, overflow: 'hidden', minHeight: scanning ? 280 : 0 }} />

          {!scanning && (
            <div style={{
              height: 200, background: 'var(--bg-elevated)', borderRadius: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 12, marginBottom: 16,
              border: '2px dashed var(--border)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--border-default)' }}>videocam_off</span>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Caméra arrêtée</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={scanning ? stopScanner : startScanner}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>{scanning ? 'stop_circle' : 'play_circle'}</span>
              {scanning ? 'Arrêter' : 'Démarrer le scan'}
            </button>
          </div>
        </div>

        {/* Saisie manuelle & Résultat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Résultat du scan */}
          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--primary-500)', animation: 'spin 1s linear infinite', display: 'block', marginBottom: 12 }}>autorenew</span>
              <p style={{ color: 'var(--text-muted)' }}>Validation en cours…</p>
            </div>
          )}

          {result && !loading && (
            <div
              className="card"
              style={{
                textAlign: 'center',
                border: `2px solid ${result.statut === 'autorise' ? 'var(--success)' : 'var(--danger)'}`,
                background: result.statut === 'autorise'
                  ? 'rgba(16,185,129,0.06)'
                  : 'rgba(239,68,68,0.06)',
                padding: 32,
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <span className="material-symbols-outlined" style={{
                  fontSize: '4rem',
                  color: result.statut === 'autorise' ? 'var(--success-500)' : 'var(--danger-500)',
                }}>{result.statut === 'autorise' ? 'check_circle' : 'cancel'}</span>
              </div>
              <h2 style={{
                color: result.statut === 'autorise' ? 'var(--success)' : 'var(--danger)',
                marginBottom: 8, fontSize: '1.5rem',
              }}>
                {result.statut === 'autorise' ? 'AUTORISÉ' : 'REFUSÉ'}
              </h2>

              {result.statut === 'autorise' && result.client && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {result.client.prenom} {result.client.nom}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{result.client.email}</p>
                  <span className="badge badge-primary" style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>{result.type === 'simple' ? 'local_activity' : 'card_membership'}</span>
                    {result.type === 'simple' ? 'Ticket simple' : 'Abonnement'}
                  </span>
                </div>
              )}

              {result.statut === 'refuse' && (
                <p style={{ color: 'var(--danger)', fontSize: '0.95rem', marginTop: 8 }}>
                  {result.motif}
                </p>
              )}

              <button
                className="btn btn-ghost"
                style={{ marginTop: 20, width: '100%' }}
                onClick={() => { setResult(null); }}
              >
                Scanner un autre QR Code
              </button>
            </div>
          )}

          {/* Saisie manuelle */}
          <div className="card">
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)' }}>keyboard</span>
              Saisie manuelle
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 14 }}>
              Si la caméra n'est pas disponible, collez ici les données du QR Code.
            </p>
            <form onSubmit={handleManualScan} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <textarea
                className="form-input"
                rows={3}
                placeholder='{"id":"...","sig":"..."}'
                value={manual}
                onChange={e => setManual(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }}
              />
              <button className="btn btn-primary" type="submit" disabled={!manual.trim() || loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>search</span> Valider
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
