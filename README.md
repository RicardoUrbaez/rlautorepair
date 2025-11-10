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

This project includes a complete integration with the Tekmetric API.

### Environment Variables

The following secrets are configured in Lovable Cloud:

- `TEKMETRIC_CLIENT_ID` - Your Tekmetric client ID
- `TEKMETRIC_CLIENT_SECRET` - Your Tekmetric client secret
- `TEKMETRIC_BASE_URL` - Tekmetric API base URL (e.g., sandbox.tekmetric.com)

### Available Edge Functions

- **tekmetric-ping** - Test API connection and authentication
- **tekmetric-appointments** - Fetch and create appointments (GET/POST)
- **tekmetric-customers** - Fetch customer data (GET)
- **tekmetric-auth** - Get OAuth access token

### Testing the Integration

Visit `/tekmetric-test` in your application to test the Tekmetric API integration:

1. Test the connection to verify credentials
2. Fetch appointments from Tekmetric
3. Fetch customers from Tekmetric

### Using the API in Your Code

Import the helper functions from `@/lib/tekmetric`:

```typescript
import { 
  testTekmetricConnection,
  fetchTekmetricAppointments,
  createTekmetricAppointment,
  fetchTekmetricCustomers 
} from "@/lib/tekmetric";

// Test connection
const result = await testTekmetricConnection();

// Fetch appointments
const appointments = await fetchTekmetricAppointments({
  shopId: "your-shop-id",
  startDate: "2024-01-01",
  endDate: "2024-12-31"
});

// Create appointment
const newAppointment = await createTekmetricAppointment({
  customerId: "customer-id",
  shopId: "shop-id",
  scheduledDate: "2024-01-15",
  scheduledTime: "10:00:00"
});

// Fetch customers
const customers = await fetchTekmetricCustomers();
```

### Security

All API credentials are stored securely as environment variables in Lovable Cloud and are never exposed to the frontend. The edge functions handle all authentication and API communication server-side.
