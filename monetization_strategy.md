# Sparky Monetization Strategy: Ads & Premium Features

This document outlines a strategy for introducing monetization into the Sparky application, focusing on a user-centric approach that balances revenue generation with a high-quality user experience.

## 1. Core Philosophy

Our monetization strategy is built on the principle of **value exchange**. We will avoid intrusive, experience-degrading ad formats. Instead, we will focus on offering users clear choices and tangible benefits, ensuring that the application remains enjoyable and functional for both free and paid users.

**Key Principles:**
-   **User Experience First:** The core creative process, especially within the Editor, must remain clean and uninterrupted.
-   **Clarity and Transparency:** Users should always understand why they are seeing an ad or what they gain from a premium feature.
-   **Non-disruptive Formats:** Prioritize ad formats that are user-initiated (rewarded) or seamlessly integrated (native) over formats that interrupt the user's flow (interstitials, pop-ups).

## 2. Premium Features (In-App Purchases)

The primary monetization method will be a "Pro" subscription that unlocks premium features and provides a larger credit allowance.

-   **Pro-Tier Tools & Assets:** Certain high-quality or computationally expensive assets, such as specific hairstyles, filters, or analysis reports, will be designated as "Pro".
-   **Upgrade Prompts:** Free users who attempt to use a Pro feature will be shown a non-intrusive modal explaining the benefit of upgrading and providing a direct path to the subscription page.
-   **Ad-Free Experience:** A key benefit of the Pro plan will be a completely ad-free experience.

## 3. Ad Implementation Strategy

Ads will be introduced as a secondary revenue stream, primarily targeting free-tier users.

### 3.1 Recommended Ad Formats

#### a) Rewarded Ads (High Priority)
This is the most user-friendly ad format and should be our primary focus.
-   **Mechanism:** Users can voluntarily watch a short video ad (15-30 seconds) in exchange for a small reward.
-   **Reward:** 1-2 extra generation credits.
-   **Trigger Points:**
    1.  **Out of Credits:** When a user with 0 credits attempts to generate an image, the modal will offer two choices: "Upgrade to Pro" or "Watch Ad for 1 Credit".
    2.  **Daily Reward:** A small, non-intrusive button on the Home or Profile page could offer a "Daily Free Credit" by watching an ad, encouraging daily engagement.

#### b) Native Ads (Medium Priority)
These ads are designed to blend in with the app's content, making them less jarring.
-   **Mechanism:** An ad that is styled to look like a native piece of content but is clearly labeled as "Sponsored" or "Ad".
-   **Placement Ideas:**
    -   **Tools Page:** A single "Sponsored Tool" tile that links to a relevant app or product. It would appear as the 5th or 6th item in the grid.
    -   **History Page:** A "Sponsored Creation" tile that appears after every 10-15 generated images in the user's history.

#### c) Banner Ads (Low Priority)
Traditional but can be disruptive if not placed carefully.
-   **Mechanism:** A small, static banner at the top or bottom of the screen.
-   **Placement Strategy:**
    -   **AVOID** on core creative pages (`HomePage`, `EditorPage`).
    -   **CONSIDER** on less-frequented or utility pages like `Settings`, `Profile`, or the bottom of the `HistoryPage`. The impact on user experience should be carefully measured.

### 3.2 Ads to AVOID

-   **Interstitial Ads:** Full-screen ads that appear unexpectedly between pages or actions. These are highly disruptive and should be avoided entirely.
-   **Pop-up Ads:** Any ad that appears without direct user initiation.

### 3.3 Technical Recommendations

-   **Ad Provider:** **Google AdMob** is the industry standard, offering a robust SDK, a wide variety of ad formats (including rewarded and native), and excellent mediation capabilities.
-   **Frequency Capping:** Implement strict frequency capping to prevent ad fatigue. For example, a user should not see more than 3-4 rewarded ad prompts per day.
-   **SDK Integration:** Implementation will require integrating the AdMob SDK into the application, creating platform-specific ad unit IDs, and building wrapper components to handle the loading and display of ads.

By following this strategy, we can successfully monetize Sparky while respecting our users and maintaining the high-quality experience that will drive long-term growth and loyalty.