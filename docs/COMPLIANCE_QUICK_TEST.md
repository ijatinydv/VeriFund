# Compliance-First Feature - Quick Testing Guide

## ✅ Pre-Flight Checklist

Before testing, ensure:
- [ ] VeriFundConsentRegistry deployed on Sepolia
- [ ] `.env` contains `CONSENT_REGISTRY_ADDRESS`
- [ ] Backend server's wallet has Sepolia ETH
- [ ] Frontend and backend servers are running

## 🚀 Quick Test (5 Minutes)

### Step 1: Start Registration
1. Open VeriFund app
2. Connect with a **NEW** MetaMask wallet
3. Role Selection Dialog appears

### Step 2: Verify UI Changes
Check these new UI elements:
- [ ] Two role cards (Creator/Investor) are clickable
- [ ] Clicking a role card highlights it (colored border + background)
- [ ] Grey consent box appears below role cards
- [ ] Consent checkbox with DPDP Act text
- [ ] "Complete Registration" button at bottom

### Step 3: Test Consent Requirement
1. Click on a role card (e.g., Creator)
2. **DO NOT** check consent checkbox
3. Try to proceed
4. ✅ Expected: Button is **DISABLED**
5. ✅ Expected: Button text: "Please provide consent to continue"

### Step 4: Complete Registration
1. Check the consent checkbox
2. ✅ Expected: Button becomes **ENABLED**
3. ✅ Expected: Button text: "Complete Registration as Creator"
4. Click the button
5. ✅ Expected: Login successful, JWT token received

### Step 5: Verify Backend Logs
Check terminal running backend server:

```
Expected logs sequence:
📝 Recording consent on-chain for user: 0x...
✅ Consent transaction sent: 0x...
⏳ Waiting for blockchain confirmation...
✅ Consent recorded on-chain in block #...
🔗 View on Etherscan: https://sepolia.etherscan.io/tx/...
```

### Step 6: Verify on Blockchain
1. Copy transaction hash from logs (starts with `0x`)
2. Open: `https://sepolia.etherscan.io/tx/[PASTE_HASH_HERE]`
3. ✅ Expected: Transaction status = Success ✅
4. Click "Logs" tab
5. ✅ Expected: Event "ConsentLogged" appears
6. Verify user address matches your wallet

## 🎯 What Makes This "Compliance-First"?

| Feature | Implementation | DPDP Compliance |
|---------|----------------|-----------------|
| Explicit Consent | User MUST check box | ✅ No pre-checked boxes |
| Informed Consent | Clear text about data processing | ✅ Transparent communication |
| Immutable Record | Stored on blockchain | ✅ Permanent audit trail |
| Timestamped | Block timestamp | ✅ Verifiable consent date |
| User Awareness | "...recorded on blockchain..." | ✅ User knows what happens |

## 🔧 Troubleshooting

### Problem: Button won't enable
**Solution:** 
- Ensure a role card is selected (should have colored border)
- Ensure consent checkbox is checked
- Refresh page and try again

### Problem: No blockchain logs
**Solution:**
- Check backend console for errors
- Verify `CONSENT_REGISTRY_ADDRESS` in `.env`
- Verify wallet has Sepolia ETH (`eth.getBalance(address)`)
- Check Sepolia RPC endpoint is working

### Problem: Transaction fails
**Solution:**
- Check Sepolia Etherscan for network status
- Verify contract owner address matches backend wallet
- Increase gas limit in web3.service.js if needed

## 📊 Expected Results Summary

| Stage | User Sees | Backend Does | Blockchain Records |
|-------|-----------|--------------|-------------------|
| 1. Select Role | Card highlights | Nothing yet | Nothing yet |
| 2. Check Consent | Button enables | Nothing yet | Nothing yet |
| 3. Click Button | Login success | Creates user + fires consent TX | Transaction pending |
| 4. Background | Using the app | Logs TX hash | Transaction confirms |
| 5. After ~15s | Normal usage | Success log | Event "ConsentLogged" ✅ |

## 🎉 Success Criteria

Your implementation is working correctly if:

✅ User cannot register without checking consent  
✅ User receives login token immediately (no blockchain wait)  
✅ Backend logs show successful transaction  
✅ Transaction visible on Sepolia Etherscan  
✅ ConsentLogged event contains correct user address  
✅ Consent text clearly mentions DPDP Act  

## 📝 Demo Script (For Presentation)

> "VeriFund is built compliance-first for India's regulatory future. Let me show you how we handle user consent under the DPDP Act 2023."

1. **Show Role Selection:** 
   > "When a user registers, they first choose their role - Creator or Investor."

2. **Show Consent Checkbox:**
   > "Before they can proceed, they must explicitly consent to data processing. Notice we reference both our Privacy Policy and the DPDP Act."

3. **Show Disabled Button:**
   > "The registration button is disabled until they provide consent. No hidden checkboxes, no fine print."

4. **Complete Registration:**
   > "Once they consent, they can complete registration."

5. **Show Blockchain Record:**
   > "Here's the unique part - their consent is permanently recorded on the Ethereum blockchain. Let me show you the transaction..."
   > [Open Etherscan, show ConsentLogged event]

6. **Explain Benefits:**
   > "This creates an immutable audit trail. Users can verify their consent anytime. Regulators can audit our compliance. And it builds trust through transparency."

## 🔗 Quick Links

- Sepolia Etherscan: https://sepolia.etherscan.io
- Contract Address: Check your `.env` file
- DPDP Act Reference: https://www.meity.gov.in/data-protection-framework

---

**Ready to test?** Start with Step 1! ⬆️
