const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();

const musicDirectory = path.join(__dirname, 'music');
const coverDirectory = path.join(__dirname, 'covers');

const upload = multer({ dest: coverDirectory });

app.get('/api/songs', (req, res) => {
  fs.readdir(musicDirectory, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при чтении папки с музыкой' });
    }
    const songs = files.filter(file => file.endsWith('.mp3')).map(file => ({
      filename: file,
      coverUrl: `/api/songs/${file}/cover`
    }));
    res.json(songs);
  });
});

app.get('/api/songs/:filename/cover', (req, res) => {
  const { filename } = req.params;
  const coverPath = path.join(coverDirectory, `${filename}.jpg`);
  if (fs.existsSync(coverPath)) {
    res.sendFile(coverPath);
  } else {
    res.sendFile(path.join(__dirname, 'default_cover.jpg'));
  }
});

app.get('/api/songs/:filename/play', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(musicDirectory, filename);
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    res.status(404).send('Файл не найден');
  }
});

app.use('/covers', express.static(coverDirectory));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
