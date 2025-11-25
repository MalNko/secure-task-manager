import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import TaskList from './components/TaskList';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <div className="App">
      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div>
          <header className="app-header">
            <h1>Secure Task Manager</h1>
            <div className="user-info">
              <span>Welcome, {user?.username}!</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </header>
          <TaskList token={token} />
        </div>
      )}
    </div>
  );
}

export default App;