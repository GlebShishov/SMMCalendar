import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { getSession } from 'next-auth/react';
import Papa from 'papaparse';
import XLSX from 'xlsx';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Check authentication
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ message: 'Import failed', error: err.message });
      }

      let data = [];
      const importType = fields.importType?.[0];
      
      // Handle different import types
      if (importType === 'csv' && files.file) {
        const file = files.file;
        const fileContent = await fs.readFile(file.filepath, 'utf8');
        
        // Parse CSV
        const result = Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true
        });
        
        data = processImportedData(result.data);
      } 
      else if (importType === 'excel' && files.file) {
        const file = files.file;
        const fileContent = await fs.readFile(file.filepath);
        
        // Parse Excel
        const workbook = XLSX.read(fileContent, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        data = processImportedData(jsonData);
      } 
      else if (importType === 'googleSheets' && fields.url?.[0]) {
        const sheetsUrl = fields.url[0];
        
        // Extract sheet ID from URL
        const matches = sheetsUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!matches || !matches[1]) {
          return res.status(400).json({ message: 'Invalid Google Sheets URL' });
        }
        
        const sheetId = matches[1];
        const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        
        // Fetch Google Sheet as CSV
        const response = await axios.get(exportUrl);
        const result = Papa.parse(response.data, {
          header: true,
          skipEmptyLines: true
        });
        
        data = processImportedData(result.data);
      } 
      else {
        return res.status(400).json({ message: 'Invalid import request' });
      }

      res.status(200).json({ success: true, data });
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Process imported data into the format needed for the calendar
function processImportedData(data) {
  const days = Array(7).fill().map(() => ({
    socialNetwork: '',
    images: [],
    text: ''
  }));
  
  // Map imported data to days
  // Assuming data has columns: day (0-6), socialNetwork, text
  data.forEach(row => {
    const dayIndex = parseInt(row.day);
    
    // Skip invalid data
    if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
      return;
    }
    
    days[dayIndex] = {
      socialNetwork: row.socialNetwork || '',
      images: [], // Images need to be uploaded separately
      text: row.text || ''
    };
  });
  
  return days;
}
