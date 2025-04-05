const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

// Запускаем Next.js сервер
const nextProcess = spawn('npm', ['run', 'dev'], {
  shell: true,
  stdio: 'inherit'
});

// Ждем 3 секунды, чтобы Next.js сервер успел запуститься
setTimeout(() => {
  // Запускаем Electron
  const electronProcess = spawn(electron, ['.'], {
    shell: true,
    stdio: 'inherit'
  });

  // Обработка выхода
  electronProcess.on('close', () => {
    nextProcess.kill();
    process.exit();
  });
}, 3000); 