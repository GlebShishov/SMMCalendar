import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  // Проверяем, является ли запрос запросом к изображению в проекте
  if (request.nextUrl.pathname.startsWith('/projects/') && request.nextUrl.pathname.includes('/images/')) {
    try {
      // Получаем токен сессии
      const token = await getToken({ req: request });
      
      // Извлекаем projectId из URL
      const pathParts = request.nextUrl.pathname.split('/');
      const projectIndex = pathParts.indexOf('projects');
      if (projectIndex === -1 || projectIndex + 1 >= pathParts.length) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
      }
      const projectId = pathParts[projectIndex + 1];

      // Если нет токена, возвращаем 403
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Пропускаем запрос дальше
      return NextResponse.next();
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  // Для всех остальных запросов пропускаем дальше
  return NextResponse.next();
}

// Указываем, для каких путей должен срабатывать middleware
export const config = {
  matcher: '/projects/:projectId/images/:path*'
}; 