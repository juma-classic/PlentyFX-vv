# Smart Trading Flow Comparison

## Current (Broken) Flow

```
User Clicks "Start Auto Trading"
         ↓
Initialize Smart Trading Executor
         ↓
Set overUnderActive = true
         ↓
Monitor Market Conditions
         ↓
Condition Met? → NO → Keep Monitoring
         ↓ YES
Dispatch 'load.bot.file' Event
         ↓
main.tsx Event Listener Receives Event
         ↓
Find "Raziel Over Under.xml" in bots array
         ↓
Switch to Bot Builder Tab
         ↓
Load Bot XML into Workspace
         ↓
Wait 1.5 seconds
         ↓
Click Run Button Programmatically
         ↓
Bot St