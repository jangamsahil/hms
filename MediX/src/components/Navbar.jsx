import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Activity, LogOut, User, Moon, Sun } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }} className="glass-panel">
      <Link to="/" style={{ textDecoration: 'none', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ background: 'var(--color-accent)', padding: '8px', borderRadius: '8px' }}>
          <Activity color="#fff" size={24} />
        </div>
        <h2 style={{ letterSpacing: '1px', fontWeight: 'bold' }}>MediX</h2>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)', padding: '8px' }} title="Toggle Theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={16} /> 
              {user.name} ({user.role})
            </span>
            <button onClick={logout} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        ) : (
          <Link to="/auth">
            <button className="btn-primary">Sign In</button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
