/**
 * Smart Expense Tracker - Gmail Parsing Script
 * 
 * 1. Go to script.google.com and create a new project.
 * 2. Paste this code.
 * 3. Update the API_URL, API_SECRET, and YOUR_EMAIL variables.
 * 4. Set up a Time-driven trigger to run the "checkRecentEmails" function every 15 minutes.
 */

const API_URL = "https://your-backend-domain.com/api/expenses"; // e.g. from Render or Railway
const API_SECRET = "some_random_string_for_apps_script"; // MUST match the backend .env API_SECRET
const YOUR_EMAIL = "your_email@gmail.com"; 

function checkRecentEmails() {
  // Search criteria: looking for transaction emails from specific banks/vendors 
  // You can adjust the query string to match your bank's notification emails
  const searchQuery = "subject:Transaction OR subject:Payment OR subject:Receipt label:inbox is:unread";
  
  const threads = GmailApp.search(searchQuery, 0, 10);
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    
    messages.forEach(message => {
      if (message.isUnread()) {
        const body = message.getPlainBody();
        const subject = message.getSubject();
        
        // --- PARSING LOGIC ---
        // This regex tries to find dollar amounts like $45.99
        const amountMatch = body.match(/\$([0-9,]+\.[0-9]{2})/);
        
        // Vendor logic: fallback to extracting from subject for simplicity
        // E.g., "Payment to Starbucks" -> "Starbucks"
        // This is a basic generic parser. Tailor it to your bank's specific email format.
        let vendor = "Unknown Vendor";
        const vendorMatch = subject.match(/to\s(.*)/i) || body.match(/Merchant:\s(.*)/i);
        if (vendorMatch) {
          vendor = vendorMatch[1].trim();
        } else {
          // Fallback to the subject itself
          vendor = subject;
        }

        if (amountMatch) {
          const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
          
          const payload = {
            description: vendor,
            amount: amount,
            category: "", // Let OpenAI on the backend handle this
            isAutoParsed: true,
            userEmail: YOUR_EMAIL,
            apiSecret: API_SECRET
          };

          const options = {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify(payload)
          };
          
          try {
            UrlFetchApp.fetch(API_URL, options);
            
            // Mark email as read so we don't process it again
            message.markRead();
            Logger.log(`Successfully processed transaction: ${vendor} - $${amount}`);
          } catch(e) {
            Logger.log("Error sending to backend: " + e.toString());
          }
        }
      }
    });
  });
}
