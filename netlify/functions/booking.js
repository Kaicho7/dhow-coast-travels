exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const data = JSON.parse(event.body);
    console.log('Booking request received:', data);
    // Placeholder: In production, forward to email (SendGrid) or Google Sheet.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Booking request received. We will contact you shortly.' })
    };
  } catch (error) {
    console.error('Error processing booking:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
