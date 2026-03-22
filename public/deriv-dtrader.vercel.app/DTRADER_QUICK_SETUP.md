# DTrader Quick Setup - 5 Minute Integration

## 🚀 Fastest Way to Integrate DTrader

### Step 1: Create Component (2 minutes)

Create `src/components/DTraderIframe.jsx`:

```jsx
import React, { useState, useEffect } from 'react';

export default function DTraderIframe() {
    const [url, setUrl] = useState('');

    useEffect(() => {
        // Get auth data
        const token = localStorage.getItem('authToken');
        const loginId = localStorage.getItem('active_loginid');
        
        if (!token || !loginId) {
            setUrl('https://deriv-dtrader.vercel.app/dtrader');
            return;
        }

        // Get currency
        const accounts = JSON.parse(localStorage.getItem('clientAccounts') || '{}');
        const currency = accounts[loginId]?.currency || 'USD';

        // Build URL with token
        const params = new URLSearchParams({
            acct1: loginId,
            token1: token,
            cur1: currency,
            lang: 'EN',
            app_id: '117918'  // Replace with your app ID
        });

        setUrl(`https://deriv-dtrader.vercel.app/dtrader?${params}`);
    }, []);

    return (
        <iframe
            src={url}
            style={{
                width: '100%',
                height: '84vh',
                border: 'none'
            }}
            title="DTrader"
        />
    );
}
```

### Step 2: Add Route (1 minute)

In your `App.jsx`:

```jsx
import DTraderIframe from './components/DTraderIframe';

// Add route
<Route path="/dtrader" element={<DTraderIframe />} />
```

### Step 3: Add Navigation (1 minute)

```jsx
<Link to="/dtrader">DTrader</Link>
```

### Step 4: Test (1 minute)

1. Log in with your Deriv token
2. Click "DTrader" link
3. Should auto-login and show trading interface

## ✅ Done!

Your users can now trade directly in your app without leaving! 🎉

---

## 🔧 Customization Options

### Change Iframe Size

```jsx
<iframe
    src={url}
    style={{
        width: '100%',
        height: '90vh',  // Change this
        border: 'none'
    }}
/>
```

### Add Loading State

```jsx
const [loading, setLoading] = useState(true);

<iframe
    src={url}
    onLoad={() => setLoading(false)}
    style={{ display: loading ? 'none' : 'block' }}
/>
{loading && <div>Loading DTrader...</div>}
```

### Handle Errors

```jsx
const [error, setError] = useState(null);

useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        setError('Please log in first');
        return;
    }
    // ... rest of code
}, []);

if (error) return <div>{error}</div>;
```

---

## 📱 Mobile Responsive

```jsx
<iframe
    src={url}
    style={{
        width: '100%',
        height: window.innerWidth <= 768 ? '85vh' : '84vh',
        border: 'none'
    }}
/>
```

---

## 🔐 Security Tips

### 1. Clear Token from URL

```jsx
useEffect(() => {
    // After iframe loads, clear token from URL
    setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
    }, 1000);
}, []);
```

### 2. Validate Token

```jsx
const isValidToken = (token) => {
    return token && token.length > 20;
};

if (!isValidToken(token)) {
    setError('Invalid token');
    return;
}
```

### 3. Use HTTPS Only

```jsx
if (window.location.protocol !== 'https:') {
    window.location.protocol = 'https:';
}
```

---

## 🎨 Styling Examples

### With Border and Shadow

```css
.dtrader-iframe {
    width: 100%;
    height: 84vh;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

### Full Screen

```jsx
<iframe
    src={url}
    style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
        zIndex: 9999
    }}
/>
```

### With Header

```jsx
<div>
    <div style={{ 
        padding: '1rem', 
        background: '#f5f5f5',
        borderBottom: '1px solid #ddd'
    }}>
        <h2>DTrader</h2>
    </div>
    <iframe src={url} style={{ width: '100%', height: 'calc(100vh - 60px)' }} />
</div>
```

---

## 🐛 Common Issues & Fixes

### Issue: Iframe is blank
```jsx
// Check if URL is set
console.log('DTrader URL:', url);

// Check if token exists
console.log('Token:', localStorage.getItem('authToken'));
```

### Issue: Not auto-logging in
```jsx
// Verify URL has token parameter
const urlObj = new URL(url);
console.log('Token in URL:', urlObj.searchParams.get('token1'));
```

### Issue: Wrong account
```jsx
// Check active login ID
console.log('Active Account:', localStorage.getItem('active_loginid'));
```

---

## 📊 Complete Working Example

```jsx
import React, { useState, useEffect } from 'react';

export default function DTraderPage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            // Get authentication data
            const token = localStorage.getItem('authToken');
            const loginId = localStorage.getItem('active_loginid');
            
            // Check if logged in
            if (!token || !loginId) {
                setError('Please log in to access DTrader');
                setLoading(false);
                return;
            }

            // Get account currency
            const accounts = JSON.parse(
                localStorage.getItem('clientAccounts') || '{}'
            );
            const currency = accounts[loginId]?.currency || 'USD';

            // Build DTrader URL
            const params = new URLSearchParams({
                acct1: loginId,
                token1: token,
                cur1: currency,
                lang: 'EN',
                app_id: '117918'
            });

            setUrl(`https://deriv-dtrader.vercel.app/dtrader?${params}`);
            setLoading(false);

        } catch (err) {
            console.error('Error loading DTrader:', err);
            setError('Failed to load DTrader');
            setLoading(false);
        }
    }, []);

    // Loading state
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '84vh' 
            }}>
                <p>Loading DTrader...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '84vh' 
            }}>
                <p>{error}</p>
                <button onClick={() => window.location.href = '/login'}>
                    Go to Login
                </button>
            </div>
        );
    }

    // DTrader iframe
    return (
        <div style={{ padding: '1rem' }}>
            <iframe
                src={url}
                title="Deriv DTrader"
                style={{
                    width: '100%',
                    height: '84vh',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                allow="clipboard-write"
            />
        </div>
    );
}
```

---

## 🎯 Testing Checklist

- [ ] Component renders without errors
- [ ] Iframe loads DTrader
- [ ] User is auto-logged in
- [ ] Correct account is selected
- [ ] Can place trades
- [ ] Works on mobile
- [ ] No console errors

---

## 🚀 Next Steps

1. **Add account switching** - Reload iframe when user switches accounts
2. **Add refresh button** - Let users reload DTrader
3. **Add fullscreen mode** - Better trading experience
4. **Track analytics** - Monitor DTrader usage
5. **Add error reporting** - Catch and report issues

---

## 💡 Pro Tips

1. **Cache the URL** - Don't rebuild on every render
2. **Preload iframe** - Load in background before user clicks
3. **Add loading spinner** - Better UX while loading
4. **Handle token expiry** - Refresh token automatically
5. **Test with demo account** - Always test before going live

---

**That's it! You now have DTrader integrated in 5 minutes!** 🎉

For more advanced features, see `DTRADER_INTEGRATION_GUIDE.md`

