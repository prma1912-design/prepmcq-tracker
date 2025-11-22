const express = require('express');
const fs = require('fs');
const app = express();

// Your tracking links - add more as needed
const trackingLinks = {
  'asad': 'https://www.prepmcq.com/register?ref=asad',
  'ahmed': 'https://www.prepmcq.com/register?ref=ahmed',
  'facebook': 'https://www.prepmcq.com/register?ref=facebook',
  'twitter': 'https://www.prepmcq.com/register?ref=twitter'
};

// File to store click data
const DATA_FILE = 'clicks.json';

// Load existing data or create empty
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  return { clicks: {}, conversions: {} };
}

// Save data to file
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Initialize data
let data = loadData();

// REDIRECT ROUTE - This is the magic!
app.get('/:name', (req, res) => {
  const name = req.params.name.toLowerCase();
  
  if (trackingLinks[name]) {
    data.clicks[name] = (data.clicks[name] || 0) + 1;
    saveData(data);
    console.log(`✓ Click recorded for "${name}" - Total: ${data.clicks[name]}`);
    res.redirect(trackingLinks[name]);
  } else {
    res.send('Link not found. Available: ' + Object.keys(trackingLinks).join(', '));
  }
});

// DASHBOARD - See your stats
app.get('/', (req, res) => {
  let html = `
    <html>
    <head>
      <title>PrepMCQ Link Tracker</title>
      <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #4CAF50; color: white; }
        tr:nth-child(even) { background: #f9f9f9; }
        h1 { color: #333; }
        .form { margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px; }
        select, button { padding: 10px; margin: 5px; }
        button { background: #4CAF50; color: white; border: none; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>📊 PrepMCQ Link Tracker</h1>
      <table>
        <tr><th>Link Name</th><th>Tracking URL</th><th>Clicks</th><th>Conversions</th><th>Rate</th></tr>
  `;

  for (const [name, url] of Object.entries(trackingLinks)) {
    const clicks = data.clicks[name] || 0;
    const conversions = data.conversions[name] || 0;
    const rate = clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : 0;
    html += `<tr><td><strong>${name}</strong></td><td>http://localhost:3000/${name}</td><td>${clicks}</td><td>${conversions}</td><td>${rate}%</td></tr>`;
  }

  html += `
      </table>
      <div class="form">
        <h3>➕ Record a Conversion</h3>
        <form action="/add-conversion" method="GET">
          <select name="link" required>
            <option value="">Select link...</option>
            ${Object.keys(trackingLinks).map(n => `<option value="${n}">${n}</option>`).join('')}
          </select>
          <button type="submit">Add Conversion</button>
        </form>
      </div>
    </body></html>`;
  res.send(html);
});

// Add conversion
app.get('/add-conversion', (req, res) => {
  const name = req.query.link?.toLowerCase();
  if (name && trackingLinks[name]) {
    data.conversions[name] = (data.conversions[name] || 0) + 1;
    saveData(data);
  }
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('🚀 PrepMCQ Tracker running at http://localhost:3000');
});