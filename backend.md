# Sparky Backend Architecture: A Supabase Implementation

## 1. Introduction & Core Principles

This document provides a comprehensive blueprint for the backend architecture of the Sparky application. As you may recall, the client-side application is currently using mock data. This document outlines the transition to a full-stack, production-ready system.

**Core Principle:** The entire backend will be built and hosted on **Supabase**, a powerful open-source Firebase alternative. This provides us with a cohesive, scalable, and manageable platform that includes Authentication, a Postgres Database, Storage, Edge Functions, and Real-time capabilities out of the box.

This architecture is designed to be:
- **Scalable:** Leveraging Supabase's managed cloud infrastructure.
- **Secure:** Utilizing Row Level Security (RLS) and environment secrets.
- **Performant:** Offloading heavy AI processing to serverless Edge Functions and using an in-database cache.
- **Maintainable:** A single, integrated platform simplifies development and operations.

## 2. Supabase Services Overview

We will leverage the following integrated Supabase services:

- **Supabase Auth:** For user registration, login, and session management.
- **Supabase Database (Postgres):** Our primary relational database for storing all application data, including a caching layer.
- **Supabase Storage:** For securely storing user-uploaded images and AI-generated results.
- **Supabase Edge Functions:** For running server-side business logic, especially calls to the Gemini API and payment webhooks.
- **Supabase Realtime:** For pushing live updates to the client.

---

## 3. Authentication (Supabase Auth)

User management is the foundation of our application's security and data privacy.

### Implementation:

- **Providers:** We will start with secure email/password authentication. Supabase Auth handles email confirmation, password resets, and secure session management (JWTs) automatically.
- **User Identity:** When a user signs up, Supabase Auth creates a new entry in the private `auth.users` table. This provides a unique `id` (UUID) for each user, which will be the cornerstone of our data security model.
- **Client-Side Integration:** The frontend will use the `@supabase/supabase-js` client library to handle `signUp()`, `signInWithPassword()`, and `signOut()` operations. The library will automatically manage JWT storage and refresh tokens.

### Email Templates & OTP Configuration:

- **6-Digit OTP Flow:** The application is designed for a secure and user-friendly 6-digit One-Time Password (OTP) verification flow upon signup. This requires specific configuration in the Supabase dashboard to override the default link-based confirmation.
- **Critical Configuration:** The default Supabase setup sends a confirmation link and an 8+ digit code, which is incompatible with our app's UI. It is **essential** to follow the detailed instructions in `supabase_auth_fix.md` to:
    1.  Set the OTP length to **6 digits**.
    2.  Disable the standard "Confirm email" link.
    3.  Modify the **"Confirm signup" email template** to *only* display the 6-digit OTP (`{{ .Token }}`).

Failure to correctly configure these settings in your Supabase project will result in a broken authentication flow.

### Security:

- **Row Level Security (RLS):** Every table containing user-specific data will have RLS policies enabled. These policies ensure that a logged-in user can only access and modify their own data. The user's ID, extracted from their JWT (`auth.uid()`), will be used in these policies.

---

## 4. Database Schema (Supabase Postgres)

The database is the heart of our application, persisting all user data, generations, and settings. The schema is derived directly from the types defined in `types.ts` and replaces all mock data.

For the complete SQL schema and initial data seeding scripts, please refer to the **`db_setup.md`** file in the root of the project. This file contains all the `CREATE TABLE`, `CREATE TYPE`, RLS policy, and `INSERT` statements required to initialize a new database environment.

---

## 5. Caching Strategy (In-Database)

To enhance performance and reduce redundant, costly API calls to Gemini, we will implement a caching layer directly within our PostgreSQL database. This approach avoids the complexity and cost of external caching services like Redis.

### Implementation:

-   **Cache Table:** We will create a simple key-value table within a dedicated `cache` schema, as defined in `db_setup.md`.
-   **Cache Key Generation:** In our Edge Functions, we will generate a unique, deterministic key for each generation request. This key will be a hash (e.g., SHA-256) of the `user_id`, `tool_id`, `originalImageHash`, and the specific `toolParameters`. This ensures that identical requests produce the same cache key.

-   **Edge Function Logic (Cache Integration):**
    1.  Before calling the Gemini API, the function will first query the `cache.kv_store` table for the generated key.
    2.  **Cache Hit:** If a non-expired entry is found, the function will retrieve the `value` (which could be a storage URL or JSON analysis) and return it immediately, saving a credit and reducing latency.
    3.  **Cache Miss:** If no valid entry is found, the function proceeds with the Gemini API call. Upon a successful response, it will store the result in the `cache.kv_store` table with a defined expiration time (e.g., 24 hours).

-   **Cache Invalidation & Cleanup:**
    -   The `expires_at` timestamp handles automatic invalidation.
    -   We will use the **`pg_cron`** extension (available in Supabase) to schedule a daily job that purges expired rows from `cache.kv_store` to keep the table size manageable.
    ```sql
    -- Example cron job to run daily at 3 AM UTC
    SELECT cron.schedule('cleanup-cache', '0 3 * * *', 'DELETE FROM cache.kv_store WHERE expires_at < NOW()');
    ```

---

## 6. File Storage (Supabase Storage)

All user images must be stored securely and privately.

### Buckets:

We will configure two primary storage buckets:

1.  **`user_uploads` (Private):** Stores the original photos uploaded by users.
2.  **`generations` (Public Read):** Stores the AI-generated image results. We make this public for easy sharing and displaying, as the URLs are non-guessable.

### Security Policies:

Storage buckets will be secured with policies that mirror our database RLS rules.

-   **`user_uploads` Policies:**
    -   Users can only upload files into a folder matching their own `user_id` (e.g., `user_uploads/{user_id}/original.jpg`).
    -   Users can only read/list files from their own folder.
    -   Server-side Edge Functions will have privileged access to read these files for processing.

-   **`generations` Policies:**
    -   Files can only be created by server-side Edge Functions. The client will not have upload permissions.
    -   Users can only read files from their own `user_id` folder within this bucket.

This ensures a user can never access another user's private photos.

---

## 7. Business Logic (Supabase Edge Functions)

Edge Functions are Deno-based TypeScript functions that run on the server. This is where we will move all sensitive logic, especially interactions with the Gemini API and payment provider. This prevents exposing our API keys on the client.

For detailed implementation guides and code samples for Edge Functions, please refer to the **`edge_functions.md`** document.

### Proposed Functions:

#### `process-image`
This function will be the workhorse for all image modification tools. It replaces the client-side logic in `geminiService.ts`.

-   **Trigger:** Invoked via a secure call from the client using the Supabase JS library.
-   **Input:** `toolId`, `toolParameters`, `originalImageStoragePath`.
-   **Logic:**
    1.  Verify the user is authenticated.
    2.  Check for a valid result in the **database cache**. If found, return it.
    3.  If no cache hit, check if the user has sufficient credits.
    4.  Download the original image from `user_uploads` storage.
    5.  Call the **Gemini API** using the API key stored securely as an environment variable.
    6.  Upload the new image to the `generations` storage bucket.
    7.  **Store the result in the cache**.
    8.  **In a single database transaction:**
        -   Decrement the user's `credits`.
        -   Insert into `credit_usage`.
        -   Insert into `generations`.
    9.  Return the URL of the newly generated image.

#### `analyze-face`
A dedicated function for the facial analysis tools. Logic is identical to `process-image`, but it caches and returns JSON data instead of an image URL.

#### `paymob-webhooks`
Handles subscription and credit purchase events from **Paymob**.

-   **Trigger:** Deployed as a public webhook endpoint that Paymob's servers will call after a transaction event.
-   **Logic:**
    1.  **Verify the Webhook:** Securely verify the incoming request's `HMAC` signature using our Paymob HMAC secret. This is a critical step to ensure the request is genuinely from Paymob and not a malicious actor.
    2.  **Parse the Event:** Parse the `TRANSACTION` callback object sent by Paymob.
    3.  **Check Status:** Inspect the `obj.success` and `obj.pending` fields. A successful, completed payment will have `success: true` and `pending: false`.
    4.  **Identify the User/Order:** Use the `obj.order.merchant_order_id` to identify the user or internal transaction in our database. We will set this ID when initiating the payment from our app.
    5.  **Log the Payment:** Insert a record into the `payments` table for auditing and history, storing the full callback object.
    6.  **Fulfill the Order:** Based on the successful transaction, update the user's account in the `users` table (e.g., upgrade their `plan_id` or add credits).

---

## 8. Real-time Capabilities (Supabase Realtime)

Supabase Realtime allows us to push data to the client without requiring the client to poll for changes.

### Implementation:

-   **Notifications:**
    -   The client will subscribe to changes on the `notifications` table, filtered for their `user_id`.
    -   When a new notification is inserted, Supabase will instantly push the new row to the client.
-   **Credit Balance:**
    -   The client will subscribe to updates on its own row in the `users` table.
    -   When an Edge Function deducts a credit, the change is pushed to the client, and the UI updates automatically.
-   **Configuration Data:**
    - The client will subscribe to changes on the `tools`, `hairstyles`, etc. tables. If we remotely disable a tool or add a new hairstyle, the UI will update in real-time.

---

## 9. Deployment and Workflow

-   **Local Development:** We will use the **Supabase CLI** to run the entire Supabase stack locally in Docker.
-   **Database Migrations:** All schema changes will be managed through migration files generated by the Supabase CLI, ensuring a repeatable and version-controlled database setup.
-   **Data Seeding:** The initial static data (plans, tools, hairstyles, colors) will be added via a seed script as part of the database migration process.
-   **Environment Variables:** Sensitive keys (Gemini API key, Paymob secrets, JWT secret) will be managed as secrets in the Supabase Project Dashboard and will be securely injected into Edge Functions at runtime. They will **never** be hardcoded or exposed to the client.