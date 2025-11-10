# Tekmetric Appointment Debug Guide

## 🔍 Problem
Appointments created from the Lovable frontend are not showing up on Tekmetric.com.

## ⚠️ Current Environment
- **Environment**: SANDBOX (`sandbox.tekmetric.com`)
- **Important**: Sandbox data is separate from production Tekmetric.com
- **Credentials**: From `API-RLAUTOREPAIR.xlsx`

## 🛠️ New Debugging Tools

### 1. Debug Endpoint (`/api/tekmetric/debug`)
Run comprehensive diagnostics that check:
- ✅ OAuth token validity
- ✅ Shop access and availability
- ✅ Customer data retrieval
- ✅ Appointments API access
- ✅ Environment detection (sandbox vs production)

**Access via**: Edge function `tekmetric-debug`

### 2. Enhanced Logging in Appointments Endpoint
The `tekmetric-appointments` function now logs:
- Request method and environment
- Full request payload
- Required field validation
- Response status and headers
- Detailed error messages with status codes
- Success confirmations with appointment IDs

**View logs**: Check Lovable Cloud edge function logs for `tekmetric-appointments`

### 3. Test UI at `/tekmetric-test`

New features:
- **🐛 Debug Connection**: Run full diagnostics with one click
  - Shows environment (sandbox/production)
  - Validates all API endpoints
  - Auto-fills available customer/shop IDs
  
- **✉️ Create Test Appointment**: Manual appointment creation form
  - Pre-filled with available data from diagnostics
  - Real-time success/error feedback
  - Shows exact Tekmetric response

- **🔄 Sync Status**: Monitor data synchronization
  - Last sync timestamp
  - Sync history with detailed logs
  - Manual sync trigger

## 🚀 How to Debug Your Issue

### Step 1: Run Diagnostics
1. Visit `/tekmetric-test`
2. Click **"Run Full Diagnostics"**
3. Review the results:
   - ✅ Green = Working
   - ❌ Red = Issue detected
4. Check recommendations displayed

### Step 2: Verify Environment
Look for the alert that shows:
```
Environment: SANDBOX
⚠️ You are using SANDBOX environment. 
Appointments will NOT appear on production Tekmetric.com
```

**Key Point**: Sandbox data is isolated from production!

### Step 3: Create Test Appointment
1. The diagnostics will auto-fill customer ID and shop ID
2. Adjust date/time if needed
3. Click **"Create Test Appointment"**
4. Watch for success message with appointment ID

### Step 4: Check Logs
View edge function logs to see:
- Exact request sent to Tekmetric
- Response status and body
- Any error messages

## 📊 Understanding the Results

### Successful Creation
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "customerId": 67890,
    "shopId": 1,
    "scheduledDate": "2024-01-15",
    "status": "scheduled"
  },
  "message": "Appointment created successfully"
}
```

### Failed Creation - Common Errors

#### 1. Missing Required Fields
```json
{
  "success": false,
  "error": {
    "message": "customerId is required"
  },
  "status": 400
}
```
**Fix**: Ensure all required fields are provided

#### 2. Invalid Customer/Shop ID
```json
{
  "success": false,
  "error": {
    "message": "Customer not found"
  },
  "status": 404
}
```
**Fix**: Use valid IDs from the diagnostics output

#### 3. Authentication Error
```json
{
  "success": false,
  "error": {
    "message": "Invalid token"
  },
  "status": 401
}
```
**Fix**: Token expired or invalid credentials

## 🔧 Required Fields for Tekmetric Appointments

Based on Tekmetric API, appointments typically require:
- ✅ `customerId` (required) - Must be existing customer
- ✅ `shopId` (required) - Shop where service will be performed
- ✅ `scheduledDate` (required) - Format: YYYY-MM-DD
- ✅ `scheduledTime` (required) - Format: HH:MM:SS
- 🔹 `vehicleId` (optional) - Specific vehicle for service
- 🔹 `description` (optional) - Appointment notes
- 🔹 `serviceWriterId` (optional) - Assigned technician
- 🔹 `status` (optional) - Appointment status

## 🔑 Switching to Production

If you want appointments to appear on production Tekmetric.com:

1. Get production API credentials from Tekmetric
2. Update secrets in Lovable Cloud:
   - `TEKMETRIC_CLIENT_ID` → production client ID
   - `TEKMETRIC_CLIENT_SECRET` → production secret
   - `TEKMETRIC_BASE_URL` → `api.tekmetric.com` (remove "sandbox.")
3. Run diagnostics again to verify production access
4. Test appointment creation

**⚠️ Warning**: Be careful with production data!

## 📝 Next Steps

1. **Run diagnostics** to see current status
2. **Review environment** - confirm sandbox vs production
3. **Test appointment creation** with provided IDs
4. **Check edge function logs** for detailed request/response
5. **Verify on Tekmetric sandbox** (if using sandbox credentials)

## 🆘 Troubleshooting Checklist

- [ ] Ran full diagnostics from `/tekmetric-test`
- [ ] Confirmed environment (sandbox vs production)
- [ ] Verified shops API returns data
- [ ] Verified customers API returns data
- [ ] Used valid customer ID from diagnostics
- [ ] Used valid shop ID from diagnostics
- [ ] Checked edge function logs for errors
- [ ] Confirmed date/time format is correct
- [ ] If sandbox: checked sandbox.tekmetric.com for appointment
- [ ] If production: checked tekmetric.com for appointment

## 📞 Support

If appointments still don't appear:
1. Check edge function logs: Look for `tekmetric-appointments` logs
2. Review the exact error message and status code
3. Verify credentials are correct for your environment
4. Confirm Tekmetric account has permission to create appointments
