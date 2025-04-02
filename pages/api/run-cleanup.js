import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  // Проверка аутентификации
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    // Отправляем запрос на переименование и очистку изображений
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/rename-and-cleanup-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie // Передаем куки для аутентификации
      }
    });
    
    const result = await response.json();
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error running cleanup:', error);
    return res.status(500).json({
      success: false,
      message: 'Error running cleanup',
      error: error.message
    });
  }
}
