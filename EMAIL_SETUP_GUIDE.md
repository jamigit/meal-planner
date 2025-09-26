# Email Feature Setup Guide

## Overview
The meal planner now includes email functionality using EmailJS, a free service that allows sending emails directly from your React app without a backend server.

## Features Implemented
✅ **Save & Email**: New button on WeeklyPlanner to save and email meal plans  
✅ **Re-send Email**: Button on each saved plan to re-send emails  
✅ **Multiple Recipients**: Configurable list of email addresses  
✅ **Error Handling**: Graceful failures with user feedback  
✅ **Free Service**: EmailJS free tier (200 emails/month)  

## Setup Instructions

### 1. Install Dependencies
The EmailJS dependency has been added to package.json. Run:
```bash
npm install
```

### 2. Create EmailJS Account
1. Go to [emailjs.com](https://www.emailjs.com/)
2. Create a free account
3. Verify your email address

### 3. Set Up Email Service
1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions
5. **Note your Service ID** (e.g., `service_abc123`)

### 4. Create Email Template
1. Go to **Email Templates** in EmailJS dashboard
2. Click **Create New Template**
3. Use this template content:

**Subject:**
```
Your Meal Plan: {{plan_name}}
```

**Content:**
```
Hi there!

Here's your meal plan "{{plan_name}}" created on {{created_date}}:

{{meals_list}}

{{notes}}

Total meals: {{meal_count}}

Happy cooking! 🍽️

---
Sent from your Meal Planner App
```

4. **Note your Template ID** (e.g., `template_xyz789`)

### 5. Get Public Key
1. Go to **Account** → **General** in EmailJS dashboard
2. Find your **Public Key** (e.g., `user_abc123xyz`)

### 6. Update Configuration
Edit `src/services/emailService.js` and replace:

```javascript
// Replace these with your actual EmailJS credentials
this.serviceId = 'YOUR_SERVICE_ID'        // e.g., 'service_abc123'
this.templateId = 'YOUR_TEMPLATE_ID'      // e.g., 'template_xyz789'
this.publicKey = 'YOUR_PUBLIC_KEY'        // e.g., 'user_abc123xyz'

// Update email addresses
this.emailAddresses = [
  'your-email@example.com',
  'family-member@example.com',
  'another-recipient@example.com'
  // Add as many as needed
]
```

## How It Works

### Saving Plans
- **Save Plan Only**: Saves without sending email
- **Save & Email Plan**: Saves and sends to all configured email addresses

### Re-sending Emails
- Each saved plan has an "📧 Email Plan" button
- Sends the meal plan to all configured recipients
- Shows success/failure feedback

### Email Content
The email includes:
- Plan name (or auto-generated name with date)
- List of meals with serving multipliers
- Notes (if any)
- Creation date
- Total meal count

## Troubleshooting

### "EmailJS not installed" Error
Run `npm install` to install the @emailjs/browser dependency.

### Email Not Sending
1. Check your EmailJS credentials in `emailService.js`
2. Verify your email service is properly configured in EmailJS dashboard
3. Check browser console for detailed error messages
4. Ensure you haven't exceeded the free tier limit (200 emails/month)

### Gmail Setup Issues
If using Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in EmailJS, not your regular password

## Free Tier Limits
- **200 emails per month**
- **1,000 emails per month** with EmailJS branding
- Upgrade available for higher limits

## Security Notes
- Email addresses are hardcoded in the client-side code
- EmailJS credentials are visible in the browser
- This is acceptable for personal/family use
- For production apps, consider server-side email sending

## Alternative Services
If you need more emails or different features:
- **Resend**: 3,000 emails/month free
- **SendGrid**: 100 emails/day free
- **Mailgun**: 5,000 emails/month free (first 3 months)
- **AWS SES**: Pay-per-use pricing

## Testing
1. Update the configuration with your EmailJS credentials
2. Add a test email address to the `emailAddresses` array
3. Create a meal plan and click "Save & Email Plan"
4. Check your email for the meal plan

That's it! Your meal planner now has email functionality. 📧🍽️
