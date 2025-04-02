import { getSession } from 'next-auth/react';
import dbConnect from '../../../../lib/dbConnect';
import Project from '../../../../models/Project';

export default async function handler(req, res) {
  const { method } = req;
  
  // Проверка аутентификации
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  await dbConnect();
  
  const { id } = req.query;
  
  if (method === 'PUT') {
    try {
      // Находим проект и проверяем, что пользователь является его владельцем
      const project = await Project.findOne({ 
        _id: id,
        owner: session.user.id
      });
      
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found or you do not have permission' });
      }
      
      // Обновляем информацию о проекте
      const { companyName, companyDescription, companyWebsite, socialLinks, imagePrompt } = req.body;
      
      // Обновляем только те поля, которые были предоставлены
      if (companyName !== undefined) project.companyName = companyName;
      if (companyDescription !== undefined) project.companyDescription = companyDescription;
      if (companyWebsite !== undefined) project.companyWebsite = companyWebsite;
      if (socialLinks !== undefined) project.socialLinks = socialLinks;
      if (imagePrompt !== undefined) project.imagePrompt = imagePrompt;
      
      // Обновляем время последнего изменения
      project.updatedAt = new Date();
      
      // Сохраняем изменения
      await project.save();
      
      return res.status(200).json({ 
        success: true, 
        message: 'Project information updated successfully',
        data: project
      });
    } catch (error) {
      console.error('Error updating project information:', error);
      return res.status(500).json({ success: false, message: 'Failed to update project information' });
    }
  }
  
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
