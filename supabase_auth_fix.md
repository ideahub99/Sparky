# Fixing Supabase Authentication: 6-Digit OTP Setup

A critical mismatch exists between the application's required 6-digit One-Time Password (OTP) flow and the default Supabase project's authentication settings. The default configuration sends an email containing both a confirmation link and a long, multi-digit code. This breaks the user interface, which is designed exclusively for a 6-digit code.

Follow these steps precisely in your Supabase project dashboard to resolve this issue.

### Step 1: Configure Authentication Providers

1.  Navigate to your Supabase Project.
2.  In the left sidebar, go to **Authentication** and then select **Providers**.
3.  Click to expand the **Email** provider section.
4.  Ensure **"Enable email provider"** is toggled **ON**.
5.  **Crucially, turn OFF the "Confirm email" toggle.** This feature enables link-based confirmation, which conflicts with our OTP flow and is the source of the unwanted link in the signup email.

### Step 2: Configure Email OTP Settings

1.  While still in the **Authentication** -> **Providers** -> **Email** settings, scroll down to the **"Phone/Email OTP"** section.
2.  Ensure that **"Enable phone/email OTP login"** is toggled **ON**.
3.  Set the **"OTP expiration"** to a desired validity period (e.g., `600` seconds for 10 minutes).
4.  Set the **"OTP length"** to **6**. This is the most critical step to align the backend with the frontend's 6-digit input fields.

### Step 3: Edit the "Confirm Signup" Email Template

This step will customize the email body to remove confusing text and display only the 6-digit code.

1.  In the left sidebar, go to **Authentication** -> **Templates**.
2.  Find and click on the **"Confirm signup"** template to open the editor.
3.  **Delete the entire existing content** of the email's subject and body.
4.  Set the **Subject** to: `Your Sparky Verification Code`
5.  Replace the email **Body** with the following simple HTML template. This template focuses exclusively on delivering the OTP clearly.

    ```html
    <h2>Confirm Your Signup</h2>
    <p>Your verification code for Sparky is:</p>
    <h2 style="font-size: 24px; letter-spacing: 4px; font-weight: bold; margin: 20px 0;">
      {{ .Token }}
    </h2>
    <p><i>If you did not request this, you can safely ignore this email.</i></p>
    ```
    
    **Important:** The key variable is `{{ .Token }}`. When configured correctly in the previous steps, Supabase will replace this with the 6-digit OTP. Ensure you have removed any instance of `{{ .ConfirmationURL }}`.

6.  Click **"Save"** to apply the template changes.

### Verification

After completing these steps, the authentication flow will function as designed:
-   A new user signs up and receives an email.
-   The email's subject and body are clean and simple, containing **only** the 6-digit verification code.
-   The user can enter this code into the application to successfully verify their account and log in.
