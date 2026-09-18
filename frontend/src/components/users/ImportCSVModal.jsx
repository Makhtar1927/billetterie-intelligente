import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import * as userService from '../../api/userService';

const REQUIRED_COLUMNS = ['nom', 'prenom', 'email'];

export default function ImportCSVModal({ role, onClose, onDone }) {
  const roleLabel = { admin: 'administrateurs', agent: 'agents', client: 'clients' }[role];
  const [rows,    setRows]    = useState([]);
  const [errors,  setErrors]  = useState([]);
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        // Vérifier colonnes requises
        const missing = REQUIRED_COLUMNS.filter(c =>
          !meta.fields.map(f => f.toLowerCase().trim()).includes(c)
        );
        if (missing.length) {
          toast.error(`Colonnes manquantes : ${missing.join(', ')}`);
          setFile(null);
          return;
        }
        setRows(data);
        toast.success(`${data.length} ligne(s) détectée(s)`);
      },
      error: () => toast.error('Impossible de lire le fichier CSV'),
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!rows.length) return;
    setLoading(true);
    try {
      const res = await userService.importCSV(rows, role);
      setResult(res.data.data);
      setErrors(res.data.data.errors || []);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'import');
    } finally {
      setLoading(false);
    }
  };

  // Télécharger un template CSV
  const downloadTemplate = () => {
    const csv = 'nom,prenom,email,telephone\nDoe,John,john.doe@example.com,+221700000001\nSmith,Jane,jane.smith@example.com,+221700000002';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `template_${role}s.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <h3 style={{ margin: 0 }}>📥 Importer des {roleLabel} via CSV</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.25rem' }}>✕</button>
        </div>

        {!result ? (
          <>
            {/* Template */}
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                Colonnes requises : <code style={{ color: 'var(--primary-200)' }}>nom, prenom, email</code> — Optionnel : <code style={{ color: 'var(--text-muted)' }}>telephone</code>
              </p>
              <button className="btn btn-sm btn-secondary" onClick={downloadTemplate}>⬇ Template</button>
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? 'var(--primary-500)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '40px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragActive ? 'rgba(99,102,241,0.08)' : 'var(--bg-elevated)',
                transition: 'all 0.2s',
                marginBottom: 20,
              }}
            >
              <input {...getInputProps()} />
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📄</div>
              {file ? (
                <div>
                  <p style={{ color: 'var(--success-400)', fontWeight: 600, margin: 0 }}>✅ {file.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: 4 }}>{rows.length} ligne(s) prête(s) à importer</p>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
                    {isDragActive ? 'Déposez ici…' : 'Glissez-déposez votre fichier CSV ici'}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: 6 }}>ou cliquez pour parcourir</p>
                </div>
              )}
            </div>

            {/* Aperçu */}
            {rows.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Aperçu ({Math.min(rows.length, 3)} sur {rows.length} lignes) :
                </p>
                <div className="table-wrapper">
                  <table className="table" style={{ fontSize: '0.8125rem' }}>
                    <thead>
                      <tr>
                        {Object.keys(rows[0]).map(k => <th key={k}>{k}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 3).map((r, i) => (
                        <tr key={i}>
                          {Object.values(r).map((v, j) => <td key={j}>{v}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={!rows.length || loading}
              >
                {loading ? <><div className="spinner" /><span>Import en cours…</span></> : `Importer ${rows.length} utilisateur(s)`}
              </button>
            </div>
          </>
        ) : (
          /* Rapport */
          <div>
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              ✅ {result.successes} compte(s) créé(s) avec succès
            </div>

            {errors.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 600, color: 'var(--danger-400)', marginBottom: 8 }}>
                  ⚠️ {errors.length} erreur(s) :
                </p>
                <div className="table-wrapper" style={{ maxHeight: 200, overflowY: 'auto' }}>
                  <table className="table" style={{ fontSize: '0.8125rem' }}>
                    <thead><tr><th>Ligne</th><th>Email</th><th>Raison</th></tr></thead>
                    <tbody>
                      {errors.map((e, i) => (
                        <tr key={i}>
                          <td>{e.ligne}</td>
                          <td>{e.email}</td>
                          <td style={{ color: 'var(--danger-400)' }}>{e.raison}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={onDone}>Fermer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
