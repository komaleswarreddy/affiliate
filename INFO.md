# Affiliate Management Platform Documentation

## 1. Project Overview

This project is a comprehensive Affiliate Management Platform designed to help businesses manage, track, and grow their affiliate marketing programs. The application provides tools for affiliate recruitment, commission management, performance tracking, payment processing, and fraud prevention.

## 2. Technology Stack

### Frontend
- **React**: For building the user interface
- **TypeScript**: For type-safe code
- **React Router**: For client-side routing
- **Zustand**: For state management
- **Tailwind CSS**: For styling
- **Shadcn/UI**: For UI components
- **Lucide Icons**: For icons
- **Recharts**: For data visualization
- **React Hook Form**: For form handling
- **Zod**: For validation

### Backend
- **Fastify**: Lightweight Node.js server framework
- **Drizzle ORM**: For database interactions
- **PostgreSQL**: Database (via Supabase)
- **Supabase**: For authentication and data storage
- **TypeScript**: For type-safe backend code

## 3. Project Structure

The project follows a modular architecture with clear separation of concerns:

```
/
├── node_modules/        # Dependencies
├── supabase/            # Supabase migrations and config
├── src/                 # Source code
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and APIs
│   ├── pages/           # Page components
│   ├── server/          # Backend server code
│   ├── store/           # State management
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── .env                 # Environment variables
├── package.json         # Project dependencies and scripts
└── vite.config.ts       # Vite configuration
```

## 4. Frontend Architecture

### 4.1 Main Application Files

#### main.tsx
This is the entry point for the React application. It renders the App component inside the React DOM root.

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### App.tsx
The main App component that sets up the app's routing, theme, and authentication structure. It defines all routes using React Router and implements route guards for authenticated pages.

Key features:
- Theme provider for light/dark mode
- Router setup with React Router
- Authentication protection for routes
- Main layout structure

### 4.2 State Management

The application uses Zustand for state management, with persistent storage for user authentication.

#### auth-store.ts
Manages authentication state including user details, tenant information, and login/logout functionality.

Key features:
- User authentication state
- Login/logout actions
- Password reset functionality
- User and tenant data loading

#### affiliate-store.ts
Manages state related to affiliates, including listing, creating, and updating affiliate information.

Key features:
- Affiliate listing and filtering
- Affiliate creation and updates
- Affiliate status management

#### campaign-store.ts
Manages marketing campaigns for affiliates.

Key features:
- Campaign creation and management
- Campaign metrics and reporting
- Campaign participation tracking

### 4.3 Components

#### Layout Components
- **app-shell.tsx**: Main layout wrapper that includes the header, sidebar, and main content area
- **sidebar.tsx**: Navigation sidebar with links to all application sections
- **header.tsx**: Top navigation bar with user profile, notifications, and search

#### UI Components
The project uses a customized version of the Shadcn/UI component library, which provides accessible and well-designed UI elements like:
- Buttons, inputs, and form elements
- Cards and containers
- Modals and dialogs
- Tables and data display
- Dropdowns and menus

#### Page-specific Components
Each major feature has its own specialized components:
- **Dashboard Components**: Stats cards, charts, and summary widgets
- **Affiliate Components**: Affiliate profiles, lists, and management tools
- **Campaign Components**: Campaign creation and management interfaces

## 5. Backend Architecture

### 5.1 Server Setup

#### server/index.ts
The main server entry point that configures and starts the Fastify server.

```typescript
import fastify from 'fastify';
import { configureRoutes } from './routes';
import { configureSecurity } from './security';
import { configureDatabase } from './db';

const server = fastify({
  logger: true,
});

// Configure security middleware
configureSecurity(server);

// Configure database connection
configureDatabase(server);

// Configure API routes
configureRoutes(server);

// Start the server
const start = async () => {
  try {
    await server.listen({ port: 3000 });
    server.log.info('Server listening on port 3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
```

#### server/security.ts
Handles security-related configuration for the server, including CORS, authentication, and authorization.

### 5.2 Database

#### server/db/index.ts
Sets up the database connection using Drizzle ORM with PostgreSQL.

#### server/db/schema.ts
Defines the database schema using Drizzle ORM schema definitions.

Example schema for campaigns:
```typescript
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name').notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  status: varchar('status').notNull().default('draft'),
  type: varchar('type').notNull(),
  requirements: jsonb('requirements').default({}),
  rewards: jsonb('rewards').notNull(),
  content: jsonb('content').notNull(),
  metrics: jsonb('metrics').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
```

### 5.3 API Routes

The server is organized into feature-based route modules:

#### server/routes/index.ts
Configures all API routes by registering each feature's route handler.

#### server/routes/affiliates.ts
Handles API endpoints for affiliate management:
- List/search affiliates
- Create/update affiliates
- Manage affiliate status
- Retrieve affiliate metrics

#### server/routes/commissions.ts
Handles commission-related endpoints:
- Calculate commissions
- Commission rules and tiers
- Commission approvals and rejections

#### server/routes/payments.ts
Handles payment processing:
- Payment creation and scheduling
- Payment method management
- Payment history and reporting

#### server/routes/analytics.ts
Handles data and reporting endpoints:
- Performance metrics
- Custom reports
- Dashboard statistics

## 6. Key Features

### 6.1 Dashboard

The dashboard provides a comprehensive overview of the affiliate program's performance with:
- Key performance indicators (sales, commissions, conversion rates)
- Sales and commission charts
- Top-performing affiliates
- Recent activity

```typescript
// Sample dashboard component excerpt
const Dashboard: React.FC = () => {
  const { user, tenant, role } = useAuthStore();
  const [timeFrame, setTimeFrame] = useState('month');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName}! Here's an overview of your affiliate program.
          </p>
        </div>

        <div className="flex items-center mt-4 md:mt-0 space-x-2">
          {/* Time frame selection buttons */}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat cards for KPIs */}
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Charts and data visualizations */}
      </div>
    </div>
  );
};
```

### 6.2 Affiliate Management

Comprehensive tools for managing affiliates including:
- Affiliate registration and approval
- Profile management
- Performance tracking
- Tier assignments
- Communication tools

### 6.3 Tracking Links

Manage and monitor affiliate tracking links:
- Link generation with custom parameters
- Click and conversion tracking
- Link performance analytics
- QR code generation

### 6.4 Commission Management

Tools for setting up and managing commission structures:
- Commission tier creation
- Product-specific commission rates
- Commission rules and conditions
- Commission calculation and approval workflows

### 6.5 Payment Processing

Manage affiliate payouts:
- Payout scheduling and processing
- Multiple payment method support
- Payment verification and reconciliation
- Tax document management

### 6.6 Analytics and Reporting

Detailed analytics and reporting tools:
- Performance metrics and KPIs
- Custom report generation
- Data export options
- Trend analysis

### 6.7 Fraud Prevention

Tools to detect and prevent fraudulent activities:
- Suspicious activity monitoring
- Rule-based fraud detection
- Manual review workflows
- IP and device tracking

### 6.8 Marketing Resources

Provide marketing tools and resources to affiliates:
- Creative asset management
- Campaign templates
- Influencer discovery tools
- Knowledge base and educational content

## 7. Authentication and Authorization

The application uses Supabase for authentication with JWT tokens. Authorization is managed through a role-based system:

- **Authentication**: Email/password login, secure session management
- **Multi-tenancy**: Each organization has its own isolated data
- **Role-based access**: Admin, Manager, Analyst, and Affiliate roles
- **Permission system**: Granular control over feature access

Example of the auth store:
```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password, tenantSubdomain) => {
        // Login implementation
      },

      logout: async () => {
        // Logout implementation
      },

      // Other auth-related actions
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

## 8. How to Get Started

### 8.1 Running the Application

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Start the backend server:
   ```
   npm run start:server
   ```

### 8.2 Database Setup

1. Configure your database connection in `.env`:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/affmanage
   ```

2. Run database migrations:
   ```
   npm run db:migrate
   ```

## 9. Development Guidelines

### 9.1 Code Structure

- Follow modular component architecture
- Implement responsive design for all UI elements
- Use TypeScript types for all data structures
- Follow clean code practices and meaningful naming

### 9.2 State Management

- Use Zustand stores for global state
- Keep component state local when possible
- Use React Query for server state management
- Implement optimistic updates for better UX

## 10. Conclusion

This Affiliate Management Platform provides a comprehensive solution for businesses looking to manage their affiliate marketing programs effectively. The modular architecture allows for easy extension and customization to fit specific business needs. 