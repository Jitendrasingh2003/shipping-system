const axios = require('axios');

/**
 * Common fetch helper to call Gemini API if key is present.
 */
const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'rzp_test_placeholder' || apiKey === 'placeholder' || apiKey.trim() === '') {
    throw new Error('API_KEY_MISSING');
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000
      }
    );

    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates[0] &&
      response.data.candidates[0].content &&
      response.data.candidates[0].content.parts &&
      response.data.candidates[0].content.parts[0]
    ) {
      return response.data.candidates[0].content.parts[0].text;
    }
    throw new Error('Invalid Gemini API response format');
  } catch (error) {
    console.error('Gemini API call failed:', error.message);
    throw error;
  }
};

/**
 * AI Support Chatbot Response
 */
const getAiChatResponse = async (message, roomId) => {
  const prompt = `You are "Marine Bytes AI Assistant", a friendly, professional customer support bot for Marine Bytes Logistics. 
Answer the following customer query directly. Keep the response concise, friendly, and under 3 sentences. 
Context: The customer is logged into their dashboard (ID: ${roomId}). 
If they ask to track a package, suggest going to "My Consignments" -> "Track Logs".
If they ask about rates, suggest using the "Rate Calculator" tab.
Customer query: "${message}"`;

  try {
    const responseText = await callGemini(prompt);
    return responseText.trim();
  } catch (err) {
    // Fallback logic when API key is missing or calls fail
    const cleanMsg = message.toLowerCase();
    
    if (cleanMsg.includes('hello') || cleanMsg.includes('hi') || cleanMsg.includes('hey')) {
      return "Hello! I am your Marine Bytes AI Assistant. How can I help you today? You can ask me about tracking packages, shipping rates, or courier methods!";
    }
    if (cleanMsg.includes('track') || cleanMsg.includes('status') || cleanMsg.includes('where')) {
      return "To track your package in real-time, please navigate to the 'My Consignments' tab and click 'Track Logs' on your active booking. This will load our Leaflet Live Tracker!";
    }
    if (cleanMsg.includes('price') || cleanMsg.includes('cost') || cleanMsg.includes('rate') || cleanMsg.includes('calculator')) {
      return "You can get instant pricing quotes using our 'Rate Calculator' tab. Just enter the origin, destination, and weight to calculate the rates immediately.";
    }
    if (cleanMsg.includes('delay') || cleanMsg.includes('late') || cleanMsg.includes('delivery')) {
      return "I'm sorry to hear if a package is running late. Weather or high transit volumes can sometimes cause delays. Please check the live tracking map or submit a Support Ticket in the portal so our staff can investigate.";
    }
    if (cleanMsg.includes('cancel') || cleanMsg.includes('refund')) {
      return "For cancellations and refunds, please submit a ticket in the 'Support Tickets' section. Our administration team will review and process your request shortly.";
    }
    
    return "That's a good question! Currently, I am running on a localized fallback system. To connect me to my full AI brain, please add a valid `GEMINI_API_KEY` to the server's `.env` file. How else can I assist you with your logistics needs?";
  }
};

/**
 * AI Smart Route & Shipping Mode Recommender
 */
const getAiRouteRecommendation = async (origin, destination, weight, urgency) => {
  const prompt = `You are the Marine Bytes Route Optimization AI. A user wants to ship a package:
- From: ${origin}
- To: ${destination}
- Weight: ${weight} kg
- Urgency: ${urgency} (can be: Standard, Rush, Urgent)

Recommend the absolute best shipment mode from these four options: [Standard, Express, Air, Ocean].
Also write a brief, customer-friendly explanation (maximum 2 sentences) on why this was chosen.

Your reply MUST be a clean JSON object containing EXACTLY these keys:
{
  "recommendedMode": "Air" | "Express" | "Ocean" | "Standard",
  "explanation": "Brief customer-friendly explanation."
}
Do not write any other markdown code blocks or text around the JSON.`;

  try {
    const responseText = await callGemini(prompt);
    // Parse the JSON object from the response (in case model wraps it in ```json ... ```)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.recommendedMode && parsed.explanation) {
        return parsed;
      }
    }
    throw new Error('Could not parse JSON from Gemini response');
  } catch (err) {
    // High-quality local rule-based fallback
    let recommendedMode = 'Standard';
    let explanation = '';

    const w = parseFloat(weight) || 1.0;
    const isUrgent = urgency.toLowerCase() === 'urgent';
    const isRush = urgency.toLowerCase() === 'rush';

    if (isUrgent) {
      recommendedMode = 'Air';
      explanation = `Since your delivery is marked as urgent, we recommend Air shipping to ensure the fastest possible transit from ${origin} to ${destination} via express flight.`;
    } else if (w >= 30) {
      recommendedMode = 'Ocean';
      explanation = `For a heavy shipment of ${w}kg, Ocean cargo is recommended. It offers the most economical bulk pricing, saving you significant costs over air transport.`;
    } else if (isRush || w > 10) {
      recommendedMode = 'Express';
      explanation = `We recommend Express shipping. It provides a faster road/rail route from ${origin} to ${destination} for your package with priority handling at a moderate price.`;
    } else {
      recommendedMode = 'Standard';
      explanation = `Standard shipping is recommended. It is the most cost-effective choice for your ${w}kg package from ${origin} to ${destination}, delivering reliably in 3-5 days.`;
    }

    return {
      recommendedMode,
      explanation
    };
  }
};

module.exports = {
  getAiChatResponse,
  getAiRouteRecommendation
};
