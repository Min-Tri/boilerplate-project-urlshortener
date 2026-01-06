require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const fs = require('fs');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

function dataManagement(action, input) {
  let filePath = './public/data.json';
  if (!fs.existsSync(filePath)) {
    fs.closeSync(fs.openSync(filePath, 'w'));
  }

  let file = fs.readFileSync(filePath);

  if (action === 'save data' && input != null) {
    if (file.length === 0) {
      fs.writeFileSync(filePath, JSON.stringify([input], null, 2));
    } else {
      let data = JSON.parse(file.toString());

      const urlExists = data.some(d => d.original_url === input.original_url);
      
      if (!urlExists) {
        data.push(input);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      }
    }
  }
  else if (action === 'load data' && input == null) {
    if (file.length === 0) { 
      return [];
    } else {
      let dataArray = JSON.parse(file);
      return dataArray;
    }
  }
}

app.post('/api/shorturl', (req, res) => {

  let input = req.body.url;
  
  if (!input || input === '') {
    return res.json({ error: 'invalid url' });
  }

  const urlRegex = /^https?:\/\//i;
  if (!urlRegex.test(input)) {
    return res.json({ error: 'invalid url' });
  }

  let hostname;
  try {
    const urlObj = new URL(input);
    hostname = urlObj.hostname;
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(hostname, (err, address) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const all_Data = dataManagement('load data') || [];
    const existingUrl = all_Data.find(d => d.original_url === input);
    
    if (existingUrl) {
      return res.json({
        original_url: existingUrl.original_url,
        short_url: existingUrl.short_url
      });
    }

    const dict = { 
      original_url: input, 
      short_url: all_Data.length + 1 
    };
    dataManagement("save data", dict);
    return res.json(dict);
  });
});

app.get('/api/shorturl/:shorturl', (req, res) => {
  let input = Number(req.params.shorturl);
  let all_Data = dataManagement('load data');

  if (!all_Data || all_Data.length === 0) {
    return res.json({ error: 'No short URLs found' });
  }

  const data_found = all_Data.find(d => d.short_url === input);
  
  if (data_found) {
    res.redirect(data_found.original_url);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});