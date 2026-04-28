import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('hms_token'));
    const [logId, setLogId] = useState(localStorage.getItem('hms_logId'));

    useEffect(() => {
        // If there's a user saved in localstorage, hydrate state.
        const storedUser = localStorage.getItem('hms_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (userData, jwtToken, sessionLogId) => {
        setUser(userData);
        setToken(jwtToken);
        setLogId(sessionLogId);
        localStorage.setItem('hms_user', JSON.stringify(userData));
        localStorage.setItem('hms_token', jwtToken);
        localStorage.setItem('hms_logId', sessionLogId);
    };

    const logout = async () => {
        if (token && logId) {
            try {
                // Ping backend to register logout time
                await fetch('http://localhost:3000/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ logId })
                });
            } catch (err) {
                console.error("Logout ping failed", err);
            }
        }
        
        setUser(null);
        setToken(null);
        setLogId(null);
        localStorage.removeItem('hms_user');
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_logId');
    };

    return (
        <AuthContext.Provider value={{ user, token, logId, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
