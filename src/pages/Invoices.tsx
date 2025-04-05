import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CSSProperties } from 'react';

interface Client {
  id: number;
  clientNumber: string;
  name: string;
}

interface Invoice {
  id: number;
  monthReference: string;
  createdAt: string;
  client: Client;
}

export function Invoices() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    api.get('/clients').then((res) => {
      setClients(res.data);

      if (res.data.length > 0 && !selectedClient) {
        setSelectedClient(res.data[0].id.toString()); // Auto seleciona o primeiro cliente
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedClient) return;

    api.get(`/invoices/years?client_id=${selectedClient}`).then((res) => {
      const monthRefs: string[] = res.data;

      const years = monthRefs
        .map((ref) => ref.split('/')[1])
        .filter((y): y is string => !!y);

      const uniqueYears = Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a));
      setAvailableYears(uniqueYears);

      if (uniqueYears.length > 0) {
        setSelectedYear(uniqueYears[0]); // Seleciona o ano mais recente
      }

      setSelectedMonth('');
      setInvoices([]);
    });
  }, [selectedClient]);

  useEffect(() => {
    if (!selectedClient || !selectedYear) return;

    api
      .get(`/invoices/months?client_id=${selectedClient}&year=${selectedYear}`)
      .then((res) => {
        setAvailableMonths(res.data);
        setSelectedMonth('');
      });
  }, [selectedClient, selectedYear]);

  useEffect(() => {
    if (!selectedClient || !selectedYear) return;

    api
      .get('/invoices', {
        params: {
          client_id: selectedClient,
          year: selectedYear,
          month: selectedMonth || undefined,
        },
      })
      .then((res) => setInvoices(res.data));
  }, [selectedClient, selectedYear, selectedMonth]);

  const handleUpload = async () => {
    if (!file) return alert('Selecione um arquivo PDF');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await api.post('/invoices/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedInvoice: Invoice = uploadRes.data;

      const uploadedClientId = uploadedInvoice.id.toString();

      if (uploadedClientId === selectedClient) {
        setInvoices((prev) => [...prev, uploadedInvoice]);
      } else {
        setSelectedClient(uploadedClientId);
        await api.get('/invoices', {
          params: {
            client_id: uploadedClientId,
            year: selectedYear,
            month: selectedMonth || undefined,
          },
        }).then((res) => {
          setInvoices(res.data);
        });
      }

      alert('Fatura enviada com sucesso!');
      setFile(null);
    } catch (error) {
      console.error('Erro ao enviar fatura:', error);
      alert('Erro ao enviar a fatura. Verifique o arquivo e tente novamente.');
    }
  };

  const parseMonthReference = (ref: string) => {
    const [mon, year] = ref.split('/');
    const monthMap: Record<string, { value: string; label: string }> = {
      JAN: { value: '01', label: 'JAN' },
      FEV: { value: '02', label: 'FEV' },
      MAR: { value: '03', label: 'MAR' },
      ABR: { value: '04', label: 'ABR' },
      MAI: { value: '05', label: 'MAI' },
      JUN: { value: '06', label: 'JUN' },
      JUL: { value: '07', label: 'JUL' },
      AGO: { value: '08', label: 'AGO' },
      SET: { value: '09', label: 'SET' },
      OUT: { value: '10', label: 'OUT' },
      NOV: { value: '11', label: 'NOV' },
      DEZ: { value: '12', label: 'DEZ' },
    };

    const monthData = monthMap[mon?.toUpperCase()];
    if (!monthData) return { value: '', label: ref };

    return {
      value: mon.toUpperCase(),
      label: `${monthData.label}/${year}`,
    };
    
  };

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate('/dashboard')}>
        ← Voltar para o Dashboard
      </button>
      <h1 style={styles.title}>📚 Biblioteca de Faturas</h1>

      {/* Filtros */}
      <div style={styles.filterBox}>
        <div style={styles.filterItem}>
          <label style={styles.label}>Cliente:</label>
          <select
            style={styles.select}
            onChange={(e) => setSelectedClient(e.target.value)}
            value={selectedClient}
          >
            <option value="">Selecione um cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.clientNumber})
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterItem}>
          <label style={styles.label}>Ano:</label>
          <select
            style={styles.select}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            disabled={!availableYears.length}
          >
            <option value="">Todos</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterItem}>
          <label style={styles.label}>Mês:</label>
          <select
            style={styles.select}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={!availableMonths.length}
          >
            <option value="">Todos</option>
            {availableMonths.map((ref) => {
              const { label, value } = parseMonthReference(ref);
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <ul style={styles.invoiceList}>
        {invoices.map((inv) => (
          <li key={inv.id} style={styles.invoiceItem}>
            <span>
              {inv.client.name} — {inv.monthReference}
            </span>
            <a
              href={`https://api-lumi-production.up.railway.app/invoices/${inv.id}/download`}
              style={{
                ...styles.button,
                textDecoration: 'none',
                display: 'inline-block',
              }}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              📥 Baixar PDF
            </a>
          </li>
        ))}
      </ul>

      <div style={styles.uploadBox}>
        <h3 style={styles.uploadTitle}>📩 Enviar nova fatura (PDF)</h3>

        <label htmlFor="fileInput" style={styles.uploadLabel}>
          <span style={styles.uploadIcon}>📎</span> Selecionar Arquivo
          <input
            id="fileInput"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ display: 'none' }}
          />
        </label>

        <span style={styles.fileName}>
          {file ? file.name : 'Nenhum arquivo selecionado'}
        </span>

        <button style={styles.uploadButton} onClick={handleUpload}>
          📤 Enviar
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    maxWidth: '700px',
    margin: '2rem auto',
    padding: '1rem',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  title: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  filterBox: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '2rem',
  },
  filterItem: {
    flex: '1',
    minWidth: '180px',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  },
  select: {
    width: '100%',
    padding: '0.5rem',
    fontSize: '1rem',
    borderRadius: '6px',
  },
  invoiceList: {
    listStyle: 'none',
    padding: 0,
  },
  invoiceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    marginBottom: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  button: {
    backgroundColor: '#156c38',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  uploadBox: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '10px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
    textAlign: 'center',
    marginTop: '2rem',
  },
  uploadTitle: {
    fontSize: '1.2rem',
    marginBottom: '1rem',
    fontWeight: 'bold',
  },
  uploadLabel: {
    display: 'inline-block',
    backgroundColor: '#e9ecef',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  uploadIcon: {
    marginRight: '0.5rem',
  },
  fileName: {
    display: 'block',
    fontSize: '0.9rem',
    color: '#555',
    marginTop: '0.25rem',
    marginBottom: '1rem',
  },
  uploadButton: {
    backgroundColor: '#156c38',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  backButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#156c38',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
  },
};
