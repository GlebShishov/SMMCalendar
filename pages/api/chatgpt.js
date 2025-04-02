// API endpoint for ChatGPT integration
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { prompt, text } = req.body;
    
    // Here you would typically make a call to the OpenAI API
    // For now, we'll simulate a response without making an actual API call
    // In a production environment, you would need to add your OpenAI API key
    
    // Mock response for testing purposes
    const mockResponse = `${text}\n\n${prompt}\n\nЭто текст был улучшен с помощью ChatGPT. Вы можете заменить эту заглушку на реальный вызов API OpenAI.`;
    
    // Simulate a delay to mimic API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return res.status(200).json({ 
      success: true, 
      result: mockResponse 
    });
    
    /* 
    // Real implementation would look like this:
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that improves text content for social media.'
          },
          {
            role: 'user',
            content: `Original text: ${text}\n\nInstructions: ${prompt}`
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    const result = data.choices[0].message.content;
    
    return res.status(200).json({ 
      success: true, 
      result 
    });
    */
  } catch (error) {
    console.error('ChatGPT API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing request',
      error: error.message 
    });
  }
}
