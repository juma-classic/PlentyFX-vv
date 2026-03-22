# Premium Bots Whitelist Configuration

This document explains how to manage the premium bots whitelist for your trading platform.

## Overview

The premium bots section is only visible to users whose CR (real account) or VRTC (virtual account) numbers are added to the whitelist. This provides exclusive access to advanced trading bots for selected users.

## Configuration File

The whitelist is managed in: `config/premium-whitelist.json`

## How to Add Users

1. Open `config/premium-whitelist.json`
2. Add the user's account number to the `premiumUsers` array
3. Save the file

### Example:

```json
{
  "premiumUsers": [
    "CR5186289",
    "VRTC90460",
    "CR1234567",
    "VRTC98765"
  ],
  "description": "Add CR and VRTC account numbers here to grant premium bot access"
}
```

## Account Number Format

- **CR accounts**: Real trading accounts (e.g., `CR5186289`)
- **VRTC accounts**: Virtual/demo accounts (e.g., `VRTC90460`)

## How It Works

1. When a user logs in, the system checks their active account number
2. If the account number is in the `premiumUsers` array, the premium section appears
3. The premium section displays below the free bots section with a gold/premium theme
4. Users can click on premium bots to load them into the bot builder

## Premium Bots Location

Premium bot XML files should be placed in the public directory with the naming convention:
- `Premium Zeus Master.xml`
- `Premium CFX Elite.xml`
- `Premium Martingale Pro.xml`
- etc.

You can modify the list of premium bots in `src/pages/main/main.tsx` in the `checkPremiumAndFetchBots` function.

## Testing

To test premium access:
1. Add your test account number to the whitelist
2. Log in with that account
3. Navigate to the Free Bots tab
4. The premium section should appear below the free bots

## Security Notes

- The whitelist is checked client-side for UI display
- For production, consider adding server-side validation
- Keep the whitelist file secure and version controlled
- Regularly audit the whitelist for unauthorized entries

## Troubleshooting

If premium section doesn't appear:
1. Check that the account number is correctly formatted in the whitelist
2. Verify the user is logged in with the whitelisted account
3. Check browser console for any errors
4. Clear browser cache and reload the page
