# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/8fe76f36-39ba-4b89-be3a-4fee44632068

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8fe76f36-39ba-4b89-be3a-4fee44632068) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8fe76f36-39ba-4b89-be3a-4fee44632068) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Tekmetric API Integration

This project includes a complete integration with the Tekmetric API and automatic data synchronization to Supabase.

### Environment Variables

The following secrets are configured in Lovable Cloud:

- `TEKMETRIC_CLIENT_ID` - Your Tekmetric client ID
- `TEKMETRIC_CLIENT_SECRET` - Your Tekmetric client secret
- `TEKMETRIC_BASE_URL` - Tekmetric API base URL (e.g., sandbox.tekmetric.com)

### Available Edge Functions

#### API Access Functions
- **tekmetric-ping** - Test API connection and authentication
- **tekmetric-appointments** - Fetch and create appointments (GET/POST)
- **tekmetric-customers** - Fetch customer data (GET)
- **tekmetric-auth** - Get OAuth access token

#### Data Sync Function
- **sync-tekmetric** - Synchronizes Tekmetric data to Supabase
  - Syncs customers to `tekmetric_customers` table
  - Syncs appointments to `appointments` table
  - Creates detailed sync logs in `sync_logs` table
  - Can be triggered manually or runs automatically

### Database Tables

The following tables store synced Tekmetric data:

- **tekmetric_customers** - Customer information from Tekmetric
- **tekmetric_orders** - Repair orders/invoices (ready for future use)
- **sync_logs** - History of all sync operations with status and metrics

### Automatic Synchronization

A scheduled job runs **daily at midnight (UTC)** to automatically sync data from Tekmetric to Supabase. This provides:

- **Live backup** of your Tekmetric data
- **Analytics layer** for custom reporting
- **Offline access** to critical business data
- **Audit trail** via sync logs

### Testing the Integration

Visit `/tekmetric-test` in your application to:

1. **Test Connection** - Verify Tekmetric API credentials
2. **Sync Now** - Manually trigger a full data sync
3. **View Sync History** - See past sync operations with status
4. **Compare Data** - View live Tekmetric data vs synced Supabase data

### Using the API in Your Code

Import the helper functions from `@/lib/tekmetric`:

```typescript
import { 
  testTekmetricConnection,
  fetchTekmetricAppointments,
  createTekmetricAppointment,
  fetchTekmetricCustomers,
  triggerTekmetricSync,
  fetchSyncLogs,
  fetchSyncedCustomers,
  fetchSyncedOrders
} from "@/lib/tekmetric";

// Test connection
const result = await testTekmetricConnection();

// Trigger manual sync
const syncResult = await triggerTekmetricSync();

// Get sync history
const logs = await fetchSyncLogs(10);

// Fetch synced customers from Supabase
const customers = await fetchSyncedCustomers();
```

### Sync Monitoring

Monitor sync operations through:

- **Dashboard**: `/tekmetric-test` page shows real-time sync status
- **Database**: Query `sync_logs` table for detailed history
- **Last Sync Time**: Displayed prominently in the UI

### Security

All API credentials are stored securely as environment variables in Lovable Cloud and are never exposed to the frontend. The edge functions handle all authentication and API communication server-side. RLS policies ensure only admins can access synced data.
