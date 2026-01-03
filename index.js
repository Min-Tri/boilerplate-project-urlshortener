require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

let urlDatabase = [];
let idCounter = 1;

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  let parsedUrl;
  try {
    parsedUrl = new URL(originalUrl);
  } catch {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = idCounter++;

    urlDatabase.push({
      original_url: originalUrl,
      short_url: shortUrl
    });

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = Number(req.params.short_url);

  const record = urlDatabase.find(
    (item) => item.short_url === shortUrl
  );

  if (!record) {
    return res.json({
      error: 'No short URL found for the given input'
    });
  }

  res.redirect(record.original_url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
