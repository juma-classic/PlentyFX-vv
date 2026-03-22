# DTrader Integration Guide - Complete Setup Instructions

## 📋 Overview

This guide provides step-by-step instructions to:
1. Connect your local DTrader folder with the hosted DTrader at `deriv-dtrader.vercel.app`
2. Implement token injection to auto-authenticate users
3. Deploy and test the integration

## 🎯 Two Integration Approaches

### Approach 1: Use Hosted DTrader (Recommended - Easiest)
Use the existing `deriv-dtrader.vercel.app` and inject tokens via URL parameters

### Approach 2: Self-Host DTrader (Advanced)
Clone, modify, and deploy your own DTrader instance

---

## 🚀 Approach 1: Using Hosted DTrader (Recommended)

### Step 1: Understand the Current Setup

The hosted DTrader at `deriv-dtrader.vercel.app` accepts authentication via URL parameters:

```
https://deriv-dtrader.vercel.app/dtrader?
  acct1=CR123456&        // Account login ID
  token1=abc123xyz&      // API token
  cur1=USD&              // Currency
  lang=EN&               // Language
  app_id=116974          // Your app ID
```

### Step 2: Create DTrader Component in Your App

Create a new file: `src/components/DTrader/DTraderIframe.jsx`

```jsx
import React, { useState, useEffect } from 'react';

function DTraderIframe() {
    const [dtraderUrl, setDtraderUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            // Get authentication data from localStorage
            const authToken = localStorage.getItem('authToken');
            const activeLoginId = localStorage.getItem('active_loginid');
            
            if (!authToken || !activeLoginId) {
                setError('Please log in to access DTrader');
                setIsLoading(false);
                return;
            }

            // Get account details
            const clientAccounts = JSON.parse(
                localStorage.getItem('clientAccounts') || '{}'
            );
            const accountData = clientAccounts[activeLoginId];
            const currency = accountData?.currency || 'USD';
            
            // Get app ID (replace with your actual app ID)
            const appId = process.env.REACT_APP_DERIV_APP_ID || '117918';
            
            // Build DTrader URL with parameters
            const params = new URLSearchParams({
                acct1: activeLoginId,
                token1: authToken,
                cur1: currency,
                lang: 'EN',
                app_id: appId
            });
            
            const url = `https://deriv-dtrader.vercel.app/dtrader?${params.toString()}`;
            setDtraderUrl(url);
            setIsLoading(false);
            
        } catch (err) {
            console.error('Error building DTrader URL:', err);
            setError('Failed to load DTrader');
            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="dtrader-loading">
                <p>Loading DTrader...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dtrader-error">
                <p>{error}</p>
                <button onClick={() => window.location.href = '/login'}>
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="dtrader-container">
            <iframe
                src={dtraderUrl}
                title="Deriv DTrader"
                className="dtrader-iframe"
                style={{
                    width: '100%',
                    height: '84vh',
                    border: 'none',
                    borderRadius: '8px'
                }}
                allow="clipboard-write"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
        </div>
    );
}

export default DTraderIframe;
```

### Step 3: Add CSS Styling

Create: `src/components/DTrader/DTraderIframe.css`

```css
.dtrader-container {
    width: 100%;
    height: 100%;
    padding: 1rem;
    background: var(--background-color, #f5f5f5);
}

.dtrader-iframe {
    width: 100%;
    height: 84vh;
    border: none;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dtrader-loading,
.dtrader-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 84vh;
    text-align: center;
}

.dtrader-error button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #ff444f;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.dtrader-error button:hover {
    background: #e63946;
}

/* Responsive */
@media (max-width: 768px) {
    .dtrader-container {
        padding: 0.5rem;
    }
    
    .dtrader-iframe {
        height: 85vh;
        border-radius: 0;
    }
}
```

### Step 4: Add DTrader Route

In your `src/App.jsx` or routing file:

```jsx
import DTraderIframe from './components/DTrader/DTraderIframe';

function App() {
    return (
        <Router>
            <Routes>
                {/* Other routes */}
                <Route path="/dtrader" element={<DTraderIframe />} />
            </Routes>
        </Router>
    );
}
```

### Step 5: Add Navigation Link

In your navigation/sidebar:

```jsx
<nav>
    <Link to="/dashboard">Dashboard</Link>
    <Link to="/bot-builder">Bot Builder</Link>
    <Link to="/dtrader">DTrader</Link>
    {/* Other links */}
</nav>
```

### Step 6: Test the Integration

1. **Log in to your app** with a valid Deriv API token
2. **Navigate to DTrader** tab/page
3. **Verify** that DTrader loads and you're automatically logged in
4. **Check** that you can place trades

---

## 🔧 Approach 2: Self-Hosting DTrader (Advanced)

### Prerequisites

- Node.js 16+
- Git
- Vercel account (or other hosting)
- Deriv API credentials

### Step 1: Clone DTrader Repository

```bash
# Clone the official Deriv Trader repository
git clone https://github.com/deriv-com/deriv-app.git
cd deriv-app

# Install dependencies
npm install
```

### Step 2: Locate DTrader Package

```bash
cd packages/trader
```

### Step 3: Modify Token Injection Logic

Create a new file: `packages/trader/src/Utils/token-injection.js`

```javascript
/**
 * Token Injection Utility
 * Handles authentication via URL parameters
 */

export const getTokenFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
        accountId: urlParams.get('acct1'),
        token: urlParams.get('token1'),
        currency: urlParams.get('cur1'),
        language: urlParams.get('lang'),
        appId: urlParams.get('app_id')
    };
};

export const shouldAutoLogin = () => {
    const { accountId, token } = getTokenFromUrl();
    return !!(accountId && token);
};

export const clearTokenFromUrl = () => {
    // Remove token from URL for security
    const url = new URL(window.location.href);
    url.searchParams.delete('token1');
    window.history.replaceState({}, document.title, url.toString());
};

export const authenticateWithToken = async (token, accountId) => {
    try {
        // Use Deriv API to authorize
        const api = await getDerivAPI();
        const response = await api.authorize(token);
        
        if (response.error) {
            throw new Error(response.error.message);
        }
        
        // Store authentication
        localStorage.setItem('authToken', token);
        localStorage.setItem('active_loginid', accountId);
        
        // Clear token from URL
        clearTokenFromUrl();
        
        return response.authorize;
        
    } catch (error) {
        console.error('Token authentication failed:', error);
        throw error;
    }
};
```

### Step 4: Integrate Token Injection

Modify `packages/trader/src/App/app.jsx`:

```javascript
import { useEffect } from 'react';
import { 
    getTokenFromUrl, 
    shouldAutoLogin, 
    authenticateWithToken 
} from './Utils/token-injection';

function App() {
    useEffect(() => {
        // Check for token in URL
        if (shouldAutoLogin()) {
            const { token, accountId } = getTokenFromUrl();
            
            authenticateWithToken(token, accountId)
                .then((authData) => {
                    console.log('Auto-login successful:', authData);
                    // Initialize app with authenticated user
                })
                .catch((error) => {
                    console.error('Auto-login failed:', error);
                    // Show error message
                });
        }
    }, []);
    
    // Rest of your app code
}
```

### Step 5: Configure Build

Update `packages/trader/package.json`:

```json
{
    "scripts": {
        "build": "webpack --config webpack.config.js",
        "build:prod": "NODE_ENV=production webpack --config webpack.config.js"
    }
}
```

### Step 6: Build DTrader

```bash
# Build for production
npm run build:prod

# Output will be in packages/trader/dist
```

### Step 7: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to build output
cd packages/trader/dist

# Deploy
vercel --prod

# Follow prompts to deploy
```

### Step 8: Update Your App

Update the iframe URL in your app to use your deployed version:

```javascript
const url = `https://your-dtrader.vercel.app/dtrader?${params.toString()}`;
```

---

## 🔐 Enhanced Security Implementation

### Method 1: PostMessage API (Most Secure)

#### In Your App (Parent Window)

```javascript
function DTraderWithPostMessage() {
    const iframeRef = useRef(null);
    
    useEffect(() => {
        const iframe = iframeRef.current;
        
        // Wait for iframe to load
        iframe.onload = () => {
            // Send token via postMessage
            const authData = {
                type: 'AUTH_TOKEN',
                token: localStorage.getItem('authToken'),
                accountId: localStorage.getItem('active_loginid'),
                currency: getCurrency(),
                timestamp: Date.now()
            };
            
            iframe.contentWindow.postMessage(
                authData,
                'https://deriv-dtrader.vercel.app'
            );
        };
    }, []);
    
    return (
        <iframe
            ref={iframeRef}
            src="https://deriv-dtrader.vercel.app/dtrader"
            title="DTrader"
        />
    );
}
```

#### In DTrader (Child Window)

```javascript
// Add to DTrader's initialization code
window.addEventListener('message', (event) => {
    // Verify origin
    if (event.origin !== 'https://your-app.com') {
        console.warn('Unauthorized message origin:', event.origin);
        return;
    }
    
    // Handle authentication
    if (event.data.type === 'AUTH_TOKEN') {
        const { token, accountId, currency } = event.data;
        
        // Authenticate user
        authenticateWithToken(token, accountId)
            .then(() => {
                console.log('Authentication successful');
                // Send confirmation back
                event.source.postMessage(
                    { type: 'AUTH_SUCCESS' },
                    event.origin
                );
            })
            .catch((error) => {
                console.error('Authentication failed:', error);
                event.source.postMessage(
                    { type: 'AUTH_ERROR', error: error.message },
                    event.origin
                );
            });
    }
});
```

### Method 2: Encrypted Token in URL

```javascript
import CryptoJS from 'crypto-js';

function encryptToken(token) {
    const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_KEY;
    return CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
}

function buildSecureDTraderUrl() {
    const token = localStorage.getItem('authToken');
    const encryptedToken = encryptToken(token);
    
    const params = new URLSearchParams({
        acct1: localStorage.getItem('active_loginid'),
        token1: encodeURIComponent(encryptedToken),
        cur1: getCurrency(),
        lang: 'EN',
        app_id: getAppId()
    });
    
    return `https://deriv-dtrader.vercel.app/dtrader?${params.toString()}`;
}

// In DTrader, decrypt the token
function decryptToken(encryptedToken) {
    const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_KEY;
    const bytes = CryptoJS.AES.decrypt(
        decodeURIComponent(encryptedToken), 
        SECRET_KEY
    );
    return bytes.toString(CryptoJS.enc.Utf8);
}
```

---

## 🧪 Testing Checklist

### Pre-Deployment Tests

- [ ] **Token Injection Works**
  ```bash
  # Test URL manually
  https://deriv-dtrader.vercel.app/dtrader?acct1=CR123456&token1=test_token&cur1=USD&lang=EN&app_id=117918
  ```

- [ ] **Auto-Login Functions**
  - User is automatically logged in
  - No manual login required
  - Correct account is selected

- [ ] **Account Switching**
  - Switch accounts in your app
  - DTrader updates automatically
  - Correct token is used

- [ ] **Error Handling**
  - Invalid token shows error
  - Expired token prompts re-login
  - Network errors are handled

- [ ] **Security**
  - Token is cleared from URL
  - No token in browser history
  - HTTPS is enforced

### Post-Deployment Tests

- [ ] **Production URL Works**
- [ ] **Mobile Responsive**
- [ ] **Cross-Browser Compatible** (Chrome, Firefox, Safari, Edge)
- [ ] **Performance** (Load time < 3 seconds)
- [ ] **No Console Errors**

---

## 📊 Complete Implementation Example

### File Structure

```
your-app/
├── src/
│   ├── components/
│   │   └── DTrader/
│   │       ├── DTraderIframe.jsx
│   │       ├── DTraderIframe.css
│   │       └── utils/
│   │           ├── buildDTraderUrl.js
│   │           ├── tokenManager.js
│   │           └── securityHelpers.js
│   ├── hooks/
│   │   └── useDTrader.js
│   └── App.jsx
├── .env
└── package.json
```

### buildDTraderUrl.js

```javascript
export function buildDTraderUrl(options = {}) {
    const {
        accountId = localStorage.getItem('active_loginid'),
        token = localStorage.getItem('authToken'),
        currency = 'USD',
        language = 'EN',
        appId = process.env.REACT_APP_DERIV_APP_ID
    } = options;
    
    // Validation
    if (!accountId || !token) {
        throw new Error('Missing required authentication data');
    }
    
    // Build URL
    const baseUrl = 'https://deriv-dtrader.vercel.app/dtrader';
    const params = new URLSearchParams({
        acct1: accountId,
        token1: token,
        cur1: currency,
        lang: language,
        app_id: appId
    });
    
    return `${baseUrl}?${params.toString()}`;
}

export function validateDTraderUrl(url) {
    try {
        const urlObj = new URL(url);
        const requiredParams = ['acct1', 'token1', 'cur1', 'app_id'];
        
        return requiredParams.every(param => 
            urlObj.searchParams.has(param)
        );
    } catch {
        return false;
    }
}
```

### useDTrader.js (Custom Hook)

```javascript
import { useState, useEffect } from 'react';
import { buildDTraderUrl } from '../components/DTrader/utils/buildDTraderUrl';

export function useDTrader() {
    const [dtraderUrl, setDtraderUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const loadDTrader = () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const url = buildDTraderUrl();
            setDtraderUrl(url);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const reloadDTrader = () => {
        loadDTrader();
    };
    
    useEffect(() => {
        loadDTrader();
        
        // Listen for account changes
        window.addEventListener('accountChanged', loadDTrader);
        
        return () => {
            window.removeEventListener('accountChanged', loadDTrader);
        };
    }, []);
    
    return {
        dtraderUrl,
        isLoading,
        error,
        reloadDTrader
    };
}
```

### Complete DTraderIframe.jsx

```jsx
import React from 'react';
import { useDTrader } from '../../hooks/useDTrader';
import './DTraderIframe.css';

function DTraderIframe() {
    const { dtraderUrl, isLoading, error, reloadDTrader } = useDTrader();
    
    if (isLoading) {
        return (
            <div className="dtrader-loading">
                <div className="spinner"></div>
                <p>Loading DTrader...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="dtrader-error">
                <h3>Failed to Load DTrader</h3>
                <p>{error}</p>
                <button onClick={reloadDTrader}>Retry</button>
                <button onClick={() => window.location.href = '/login'}>
                    Go to Login
                </button>
            </div>
        );
    }
    
    return (
        <div className="dtrader-container">
            <div className="dtrader-header">
                <h2>DTrader</h2>
                <button onClick={reloadDTrader} className="reload-btn">
                    ↻ Reload
                </button>
            </div>
            
            <iframe
                src={dtraderUrl}
                title="Deriv DTrader"
                className="dtrader-iframe"
                allow="clipboard-write"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
        </div>
    );
}

export default DTraderIframe;
```

---

## 🚀 Deployment Steps

### Step 1: Environment Variables

Create `.env` file:

```bash
REACT_APP_DERIV_APP_ID=116974
REACT_APP_DTRADER_URL=https://deriv-dtrader.vercel.app/dtrader
REACT_APP_ENCRYPTION_KEY=your_secret_key_here
```

### Step 2: Build Your App

```bash
npm run build
```

### Step 3: Deploy

```bash
# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod

# Or deploy to your server
scp -r build/* user@server:/var/www/html/
```

### Step 4: Test Production

```bash
# Open your deployed app
https://your-app.vercel.app/dtrader

# Verify token injection works
# Check browser console for errors
# Test on mobile devices
```

---

## 🎯 Quick Start Summary

**For Quick Implementation (5 minutes):**

1. Copy `DTraderIframe.jsx` component
2. Add route: `/dtrader`
3. Add navigation link
4. Test with your Deriv token

**URL Format:**
```
https://deriv-dtrader.vercel.app/dtrader?
  acct1=YOUR_ACCOUNT_ID&
  token1=YOUR_API_TOKEN&
  cur1=USD&
  lang=EN&
  app_id=117918
```

That's it! DTrader will auto-authenticate and users can start trading immediately. 🚀

---

## 📞 Troubleshooting

### Issue: DTrader doesn't load
**Solution:** Check browser console for CORS errors, verify URL is correct

### Issue: Token not working
**Solution:** Verify token is valid, check it's not expired

### Issue: Iframe blocked
**Solution:** Check Content Security Policy, add deriv-dtrader.vercel.app to allowed sources

### Issue: Account not switching
**Solution:** Reload iframe when account changes, verify new token is passed

---

**You now have everything needed to integrate DTrader with token injection!** 🎉

