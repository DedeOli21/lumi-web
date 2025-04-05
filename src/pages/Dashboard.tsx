import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CSSProperties } from 'react';

export function Dashboard() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    totalKwh: 0,
    totalCompensated: 0,
    valueWithoutGd: 0,
    gdEconomy: 0,
  });
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(''); // '' representa "todos"

  const navigate = useNavigate();

  useEffect(() => {
    async function loadClients() {
      const res = await api.get('/clients');
      setClients(res.data);
    }

    loadClients();
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      const params = selectedClientId ? { client_id: selectedClientId } : {};
      const res = await api.get('/dashboard', { params });
      setData(res.data.graphData);
      setSummary(res.data.summary);
    }

    loadDashboard();
  }, [selectedClientId]);

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate('/invoices')}>
        ← Voltar para Biblioteca de Faturas
      </button>

      <h1 style={styles.title}>📊 Dashboard</h1>

      {/* Filtro de Cliente */}
      <div style={styles.filterContainer}>
        <label htmlFor="client-filter" style={styles.filterLabel}>Filtrar por Cliente:</label>
        <select
          id="client-filter"
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          style={styles.select}
        >
          <option value="">Todos os clientes</option>
          {clients.map((client: any) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Cards Resumo */}
      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <strong>Total Energia Consumida:</strong> {summary.totalKwh} kWh
        </div>
        <div style={styles.card}>
          <strong>Energia Compensada:</strong> {summary.totalCompensated} kWh
        </div>
        <div style={styles.card}>
          <strong>Valor sem GD:</strong> R$ {summary.valueWithoutGd.toFixed(2)}
        </div>
        <div style={styles.card}>
          <strong>Economia GD:</strong> R$ {summary.gdEconomy.toFixed(2)}
        </div>
      </div>

      {/* Gráfico Energia */}
      <h2 style={styles.subtitle}>⚡ Gráfico de Energia</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthReference" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="energyConsumptionKwh" fill="#8884d8" name="Consumo kWh" />
          <Bar dataKey="energyCompensatedKwh" fill="#82ca9d" name="Compensado kWh" />
        </BarChart>
      </ResponsiveContainer>

      {/* Gráfico Financeiro */}
      <h2 style={styles.subtitle}>💰 Gráfico Financeiro</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthReference" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="totalValueWithoutGd" fill="#f9c74f" name="Valor sem GD" />
          <Bar dataKey="gdEconomyValue" fill="#f9844a" name="Economia GD" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    maxWidth: '900px',
    margin: '2rem auto',
    padding: '1rem',
    backgroundColor: '#fdfdfd',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  subtitle: {
    marginTop: '2rem',
    marginBottom: '1rem',
    color: '#333',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  card: {
    backgroundColor: '#f0f0f0',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  backButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#156c38',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  filterContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1.5rem',
    gap: '0.5rem',
  },
  
  filterLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  
  select: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};
