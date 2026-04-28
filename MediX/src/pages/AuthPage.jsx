import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, Users, Activity, CheckCircle2 } from 'lucide-react';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Patient' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const url = isLogin ? 'http://localhost:3000/api/auth/login' : 'http://localhost:3000/api/auth/register';
        const payload = isLogin ? { email: formData.email, password: formData.password } : formData;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Something went wrong');

            if (isLogin) {
                login(data.user, data.token, data.logId);
                navigate('/dashboard');
            } else {
                setIsLogin(true); // Switch to login after register
                setFormData({ ...formData, password: '' });
                setSuccess('Account created successfully! You can now log in.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 72px)', width: '100%', overflowX: 'hidden', overflowY: 'auto' }} className="animate-fade-in">
            
            {/* Left Hero Section - Highly Engaging */}
            <div style={{ 
                flex: 1, 
                display: window.innerWidth < 900 ? 'none' : 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                padding: '4rem',
                background: 'linear-gradient(135deg, var(--color-accent) 0%, #0D9488 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative Background Elements */}
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)' }}></div>
                <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', filter: 'blur(60px)' }}></div>

                <div style={{ position: 'relative', zIndex: 10, maxWidth: '500px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                        <Activity size={48} color="#FFFFFF" strokeWidth={2.5} />
                        <h1 style={{ fontSize: '3.5rem', margin: 0, fontWeight: '800', tracking: '-1px' }}>MediX</h1>
                    </div>
                    
                    <p style={{ fontSize: '1.25rem', lineHeight: '1.6', opacity: 0.9, marginBottom: '3rem' }}>
                        State-of-the-art Healthcare Management. Streamline your appointments, connect with specialists, and take control of your health journey instantly.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '8px' }}><Clock size={24} /></div>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Instant Bookings</h3>
                                <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>Secure 15-minute slots globally in real-time.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '8px' }}><Users size={24} /></div>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Expert Specialists</h3>
                                <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>Direct access to dedicated hospital doctors.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '8px' }}><ShieldCheck size={24} /></div>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Data Security</h3>
                                <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>Enterprise-grade encryption and archiving.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Form Section */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '2rem',
                background: 'var(--color-bg-primary)',
                position: 'relative',
                minHeight: '100%'
            }}>
                <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '450px' }}>
                    
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2rem', margin: '0 0 8px 0', color: 'var(--color-text-main)', fontWeight: '700' }}>
                            {isLogin ? 'Welcome Back' : 'Join MediX'}
                        </h2>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                            {isLogin ? 'Enter your credentials to access your portal' : 'Create an account to schedule your first appointment'}
                        </p>
                    </div>
                    
                    {/* Inline Success / Error Handling */}
                    {error && <div style={{ background: '#FEF2F2', borderLeft: '4px solid #EF4444', color: '#B91C1C', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>}
                    {success && <div style={{ background: '#F0FDF4', borderLeft: '4px solid #10B981', color: '#047857', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={18}/> {success}</div>}

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>Full Name</label>
                                <input className="input-field" type="text" placeholder="John Doe" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ marginBottom: 0 }} />
                            </div>
                        )}
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>Email Address</label>
                            <input className="input-field" type="email" placeholder="you@example.com" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ marginBottom: 0 }} />
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>Password</label>
                            <input className="input-field" type="password" placeholder="••••••••" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ marginBottom: 0 }} />
                        </div>
                        
                        {!isLogin && (
                            <>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>Account Type</label>
                                    <select className="input-field" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} style={{ marginBottom: 0, cursor: 'pointer' }}>
                                        <option value="Patient">Patient</option>
                                        <option value="Doctor">Doctor</option>
                                    </select>
                                </div>

                                {formData.role === 'Doctor' && (
                                    <div style={{ marginBottom: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-accent)' }}>Medical Specialty</label>
                                        <input className="input-field" type="text" placeholder="e.g. Cardiologist" required value={formData.specialty || ''} onChange={(e) => setFormData({...formData, specialty: e.target.value})} style={{ marginBottom: 0, borderColor: 'var(--color-accent)' }} />
                                    </div>
                                )}
                            </>
                        )}

                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem', fontSize: '1.05rem' }} disabled={loading}>
                            {loading ? 'Processing...' : (isLogin ? 'Secure Sign In' : 'Create Free Account')}
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                            {isLogin ? "Don't have an account? " : "Already registered? "}
                            <span 
                                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }} 
                                style={{ color: 'var(--color-accent)', cursor: 'pointer', fontWeight: '600', textDecoration: 'none' }}
                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                            >
                                {isLogin ? 'Get started here' : 'Log in safely'}
                            </span>
                        </p>
                    </div>
                </div>
                
                {/* Copyright Footer */}
                <div style={{ position: 'absolute', bottom: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    &copy; {new Date().getFullYear()} MediX - All Rights Reserved.
                </div>
            </div>
            
        </div>
    );
};

export default AuthPage;
