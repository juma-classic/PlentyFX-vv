import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FaPlay, FaTrash, FaSync } from 'react-icons/fa';

const CopyTradingComponent = () => {
  // State management
  const [tokens, setTokens] = useState([]);
  const [inputToken, setInputToken] = useState('');
  const [removingTokens, setRemovingTokens] = useState([]);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDemoTradingActive, setIsDemoTradingActive] = useState(false);
  const [realAccounts, setRealAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopyTradingActive, setIsCopyTradingActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [demoSuccessMessage, setDemoSuccessMessage] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialUrl, setTutorialUrl] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Mock data for real account (replace with actual API calls)
  const realAccount = {
    loginid: 'CR1234567',
    balance: 1000.50,
    currency: 'USD'
  };

  // Initialize component
  useEffect(() => {
    loadTokens();
    loadRealAccounts();
  }, []);

  // Load tokens from storage
  const loadTokens = async () => {
    try {
      // Replace with actual API call
      const storedTokens = JSON.parse(localStorage.getItem('copyTradingTokens') || '[]');
      setTokens(storedTokens);
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  };

  // Load real accounts
  const loadRealAccounts = () => {
    if (typeof localStorage !== 'undefined') {
      const accountsList = localStorage.getItem('accountsList');
      const accounts = accountsList ? JSON.parse(accountsList) : {};
      const crAccounts = Object.keys(accounts).filter(key => key.startsWith('CR'));
      setRealAccounts(crAccounts);
      if (crAccounts.length > 0) {
        setSelectedAccount(crAccounts[0]);
      }
    }
  };

  // Toggle demo to real copy trading
  const toggleDemoTrading = (isActive) => {
    setIsDemoTradingActive(isActive);
    const status = isActive ? 'started' : 'stopped';
    setDemoSuccessMessage(`Demo to Real copy trading ${status} successfully`);
    setTimeout(() => setDemoSuccessMessage(''), 10000);
  };

  // Add new token
  const addToken = async () => {
    if (!inputToken.trim()) return;
    
    try {
      const token = inputToken.trim();
      // Replace with actual API call
      await updateCopyTradingTokens(token);
      
      const updatedTokens = [token, ...tokens];
      setTokens(updatedTokens);
      localStorage.setItem('copyTradingTokens', JSON.stringify(updatedTokens));
      setInputToken('');
    } catch (error) {
      const message = error.error?.message || 'Failed to add token';
      setErrorMessage(message);
      setShowError(true);
    }
  };

  // Remove token
  const removeToken = (token) => {
    setRemovingTokens(prev => [...prev, token]);
    // Replace with actual API calls
    deleteItemFromStorage(token);
    removeCopyTradingTokens(token);
  };

  // Handle token removal animation end
  const handleTokenRemoved = (token) => {
    setTokens(prev => prev.filter(t => t !== token));
    setRemovingTokens(prev => prev.filter(t => t !== token));
  };

  // Sync tokens
  const syncTokens = async () => {
    setIsLoading(true);
    try {
      // Replace with actual API call
      const refreshedTokens = await reCallTheTokens();
      setTokens(refreshedTokens || []);
    } catch (error) {
      console.error('Error syncing tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle copy trading
  const toggleCopyTrading = () => {
    const newState = !isCopyTradingActive;
    setIsCopyTradingActive(newState);
    
    const status = newState ? 'started' : 'stopped';
    const tokenCount = tokens.length;
    setSuccessMessage(`Copy trading ${status} successfully for all ${tokenCount} tokens!`);
    setTimeout(() => setSuccessMessage(''), 10000);
  };

  // Open tutorial
  const openTutorial = (url) => {
    setTutorialUrl(url);
    setShowTutorial(true);
  };

  // Close tutorial
  const closeTutorial = () => {
    setShowTutorial(false);
    setTutorialUrl('');
  };

  // Mock API functions (replace with actual implementations)
  const updateCopyTradingTokens = async (token) => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (token.length < 10) {
          reject({ error: { message: 'Invalid token format' } });
        } else {
          resolve();
        }
      }, 1000);
    });
  };

  const deleteItemFromStorage = (token) => {
    console.log('Deleting token from storage:', token);
  };

  const removeCopyTradingTokens = (token) => {
    console.log('Removing copy trading token:', token);
  };

  const reCallTheTokens = async () => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(tokens);
      }, 2000);
    });
  };

  return (
    <div className="main_copy">
      {/* Error Modal */}
      {showError && (
        <Modal
          isOpen={showError}
          onRequestClose={() => setShowError(false)}
          className="error-modal"
          overlayClassName="modal-overlay"
        >
          <div className="modal-content">
            <h3>Error while adding new token!</h3>
            <p>{errorMessage}</p>
            <button onClick={() => setShowError(false)}>OK</button>
          </div>
        </Modal>
      )}

      {/* Demo to Real Copy Trading Section */}
      <div className="ena_DC">
        <div className="enable_disable">
          <button
            className={`copy-trading-btn ${isDemoTradingActive ? 'stop' : 'start'}`}
            onClick={() => toggleDemoTrading(!isDemoTradingActive)}
          >
            {isDemoTradingActive ? 'Stop Demo to Real Copy Trading' : 'Start Demo to Real Copy Trading'}
          </button>
          
          <div
            className="tutorial-button"
            onClick={() => openTutorial('https://www.youtube.com/embed/gsWzKmslEnY')}
            style={{
              cursor: 'pointer',
              textAlign: 'center',
              background: '#d5e2eb',
              borderRadius: '5px',
              padding: '10px'
            }}
          >
            <FaPlay size={30} style={{ color: '#FF0000' }} />
            <div style={{ fontSize: '12px', color: '#333' }}>Tutorial</div>
          </div>
        </div>

        {/* Real Account Card */}
        <div className="realaccount-card">
          <span className="realaccount-label">
            {realAccount.loginid || 'CR*****'}
          </span>
          <span className="realaccount-amount">
            {realAccount.currency ? `${realAccount.balance.toFixed(2)} ${realAccount.currency}` : '******'}
          </span>
        </div>

        {/* Demo Success Message */}
        {demoSuccessMessage && (
          <div className="success-message">{demoSuccessMessage}</div>
        )}
      </div>

      {/* Section Title */}
      <header className={`title ${isDarkMode ? 'dark_active' : ''}`}>
        <small>Add tokens to Replicator</small>
      </header>

      {/* Main Copy Trading Section */}
      <div className="copytrading">
        <div className={`input_content ${isDarkMode ? 'dark_active' : ''}`}>
          {/* Token Input Section */}
          <div className="input_items">
            <input
              type="text"
              value={inputToken}
              className="tokens-input"
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="Enter Client token"
            />
            <button className="token-action-btn" onClick={addToken}>
              Add
            </button>
            <button className="token-action-btn" onClick={syncTokens}>
              {isLoading ? 'syncing' : 'Sync'} <FaSync />
            </button>
          </div>

          {/* Copy Trading Control */}
          <div className="enable_disable">
            <button
              className={`copy-trading-btn ${isCopyTradingActive ? 'stop' : 'start'}`}
              onClick={toggleCopyTrading}
            >
              {isCopyTradingActive ? 'Stop Copy Trading' : 'Start Copy Trading'}
            </button>
            <button
              onClick={() => openTutorial('https://www.youtube.com/embed/gsWzKmslEnY')}
              style={{ cursor: 'pointer' }}
            >
              <FaPlay style={{ color: '#FF0000' }} />
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
        </div>

        {/* Tokens List */}
        <div className={`tokens_container ${isDarkMode ? 'dark_active' : ''}`}>
          <ul className="tokens-list">
            <h2>Total Clients added: {tokens.length}</h2>
            {tokens.length > 0 ? (
              tokens.map((token, index) => (
                <li
                  key={token}
                  className={`token ${removingTokens.includes(token) ? 'fall' : ''}`}
                  onTransitionEnd={() => handleTokenRemoved(token)}
                >
                  <span className="token-number">{index + 1}.</span>
                  <span className="token-item">{token}</span>
                  <button
                    className="trash-btn"
                    onClick={() => removeToken(token)}
                  >
                    <FaTrash />
                  </button>
                </li>
              ))
            ) : (
              <div className={`token_info ${isDarkMode ? 'dark_active' : ''}`}>
                No tokens added yet
              </div>
            )}
          </ul>
        </div>
      </div>

      {/* Tutorial Modal */}
      <Modal
        isOpen={showTutorial}
        onRequestClose={closeTutorial}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            height: '80vh',
            border: 'none',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            background: '#fff',
            zIndex: 1001,
            position: 'relative'
          }
        }}
      >
        <span
          onClick={closeTutorial}
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            fontSize: '30px',
            fontWeight: 'bold',
            cursor: 'pointer',
            color: '#000',
            background: 'transparent',
            border: 'none'
          }}
        >
          X
        </span>
        <h2
          style={{
            color: '#000',
            fontSize: '20px',
            textAlign: 'center',
            margin: '5px 0'
          }}
        >
          Copytrading Tutorial
        </h2>
        <iframe
          width="100%"
          height="100%"
          src={tutorialUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </Modal>
    </div>
  );
};

export default CopyTradingComponent;