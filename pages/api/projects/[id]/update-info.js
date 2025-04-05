import { promises as fs } from 'fs';
import path from 'path';
import { getSession } from 'next-auth/react';

const PROJECTS_DIR = path.join(process.cwd(), 'projects');

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { id } = req.query;
  const projectDir = path.join(PROJECTS_DIR, id);

  try {
    // Проверяем существование проекта
    await fs.access(projectDir);

    // Проверяем права доступа
    const accessFile = path.join(projectDir, 'access.json');
    const accessData = JSON.parse(await fs.readFile(accessFile, 'utf8'));

    if (!accessData.users.includes(session.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Читаем текущую информацию о клиенте
    const clientInfoFile = path.join(projectDir, 'client-info.json');
    const currentClientInfo = JSON.parse(await fs.readFile(clientInfoFile, 'utf8'));

    // Обновляем информацию о клиенте
    const updatedClientInfo = {
      clientInfo: {
        ...currentClientInfo.clientInfo,
        ...req.body
      },
      lastModified: new Date().toISOString(),
      lastModifiedBy: session.user.id
    };

    // Сохраняем обновленную информацию
    await fs.writeFile(
      clientInfoFile,
      JSON.stringify(updatedClientInfo, null, 2)
    );

    // Обновляем время последнего изменения в файле доступа
    accessData.updatedAt = new Date().toISOString();
    await fs.writeFile(
      accessFile,
      JSON.stringify(accessData, null, 2)
    );

    return res.status(200).json({
      success: true,
      data: updatedClientInfo.clientInfo
    });
  } catch (error) {
    console.error('Error updating project information:', error);
    return res.status(500).json({ success: false, message: 'Failed to update project information' });
  }
}
