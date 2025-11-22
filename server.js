const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

// Your tracking links - add more as needed
const trackingLinks = {
  'asad': 'https://www.prepmcq.com/register?ref=asad'
};

const DATA_FILE = 'clicks.json';

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  return { clicks: {}, conversions: {}, clickDetails: [] };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let data = loadData();
if (!data.clickDetails) data.clickDetails = [];

// Get country from IP using free API
async function getLocation(ip) {
  try {
    const cleanIp = ip.replace('::ffff:', '').replace('::1', '').replace('127.0.0.1', '');
    if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1') {
      return { country: 'Local', city: 'Local' };
    }
    const response = await fetch(`http://ip-api.com/json/${cleanIp}`);
    const data = await response.json();
    return { country: data.country || 'Unknown', city: data.city || 'Unknown' };
  } catch (e) {
    return { country: 'Unknown', city: 'Unknown' };
  }
}

// Parse user agent for device/browser
function parseUserAgent(ua) {
  let device = 'Desktop';
  let browser = 'Unknown';
  
  if (/mobile/i.test(ua)) device = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) device = 'Tablet';
  
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/edge/i.test(ua)) browser = 'Edge';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  
  return { device, browser };
}

// DASHBOARD
app.get('/', (req, res) => {
  let html = `
    <html>
    <head>
      <title>PrepMCQ Link Tracker</title>
      <style>
        body { font-family: Arial; max-width: 1200px; margin: 30px auto; padding: 20px; background: #f5f5f5; }
        .card { background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
        th { background: #4CAF50; color: white; }
        tr:nth-child(even) { background: #f9f9f9; }
        h1 { color: #333; margin: 0 0 10px 0; }
        h2 { color: #555; margin: 0 0 15px 0; font-size: 18px; }
        .form { display: flex; gap: 10px; align-items: center; }
        select, button { padding: 10px 15px; border-radius: 5px; border: 1px solid #ddd; }
        button { background: #4CAF50; color: white; border: none; cursor: pointer; }
        button:hover { background: #45a049; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-box { background: #4CAF50; color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .stat-box h3 { margin: 0; font-size: 32px; }
        .stat-box p { margin: 5px 0 0 0; opacity: 0.9; }
        .badge { padding: 3px 8px; border-radius: 12px; font-size: 12px; }
        .badge-mobile { background: #e3f2fd; color: #1976d2; }
        .badge-desktop { background: #f3e5f5; color: #7b1fa2; }
        .badge-tablet { background: #fff3e0; color: #f57c00; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>📊 PrepMCQ Link Tracker</h1>
        <p>Track clicks, locations, devices, and conversions</p>
      </div>

      <div class="stats">
        <div class="stat-box">
          <h3>${Object.values(data.clicks).reduce((a, b) => a + b, 0)}</h3>
          <p>Total Clicks</p>
        </div>
        <div class="stat-box" style="background: #2196F3;">
          <h3>${Object.values(data.conversions).reduce((a, b) => a + b, 0)}</h3>
          <p>Conversions</p>
        </div>
        <div class="stat-box" style="background: #FF9800;">
          <h3>${Object.keys(trackingLinks).length}</h3>
          <p>Active Links</p>
        </div>
      </div>

      <div class="card">
        <h2>📈 Link Performance</h2>
        <table>
          <tr><th>Link</th><th>URL</th><th>Clicks</th><th>Conversions</th><th>Rate</th></tr>
  `;

  for (const [name, url] of Object.entries(trackingLinks)) {
    const clicks = data.clicks[name] || 0;
    const conversions = data.conversions[name] || 0;
    const rate = clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : 0;
    html += `<tr><td><strong>${name}</strong></td><td>https://prepmcq.onrender.com/${name}</td><td>${clicks}</td><td>${conversions}</td><td>${rate}%</td></tr>`;
  }

  html += `
        </table>
      </div>

      <div class="card">
        <h2>🖱️ Recent Clicks (Last 50)</h2>
        <table>
          <tr><th>Link</th><th>Date & Time</th><th>Country</th><th>City</th><th>Device</th><th>Browser</th></tr>
  `;

  const recentClicks = (data.clickDetails || []).slice(-50).reverse();
  for (const click of recentClicks) {
    const badgeClass = click.device === 'Mobile' ? 'badge-mobile' : click.device === 'Tablet' ? 'badge-tablet' : 'badge-desktop';
    html += `<tr>
      <td><strong>${click.link}</strong></td>
      <td>${click.time}</td>
      <td>${click.country}</td>
      <td>${click.city}</td>
      <td><span class="badge ${badgeClass}">${click.device}</span></td>
      <td>${click.browser}</td>
    </tr>`;
  }

  if (recentClicks.length === 0) {
    html += `<tr><td colspan="6" style="text-align: center; color: #888;">No clicks yet</td></tr>`;
  }

  html += `
        </table>
      </div>

      <div class="card">
        <h2>➕ Record a Conversion</h2>
        <div class="form">
          <form action="/add-conversion" method="GET" style="display: flex; gap: 10px;">
            <select name="link" required>
              <option value="">Select link...</option>
              ${Object.keys(trackingLinks).map(n => `<option value="${n}">${n}</option>`).join('')}
            </select>
            <button type="submit">Add Conversion</button>
          </form>
        </div>
      </div>

    </body></html>`;
  res.send(html);
});

// Manual conversion
app.get('/add-conversion', (req, res) => {
  const name = req.query.link?.toLowerCase();
  if (name && trackingLinks[name]) {
    data.conversions[name] = (data.conversions[name] || 0) + 1;
    saveData(data);
  }
  res.redirect('/');
});

// Redirect route with analytics
app.get('/:name', async (req, res) => {
  const name = req.params.name.toLowerCase();
  
  if (trackingLinks[name]) {
    // Count click
    data.clicks[name] = (data.clicks[name] || 0) + 1;
    
    // Get details
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    const location = await getLocation(ip);
    const { device, browser } = parseUserAgent(req.headers['user-agent'] || '');
    
    // Save click details
    data.clickDetails.push({
      link: name,
      time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }),
      country: location.country,
      city: location.city,
      device: device,
      browser: browser,
      ip: ip.substring(0, 10) + '***'
    });
    
    // Keep only last 500 clicks
    if (data.clickDetails.length > 500) {
      data.clickDetails = data.clickDetails.slice(-500);
    }
    
    saveData(data);
    console.log(`✓ Click: ${name} | ${location.country} | ${device} | ${browser}`);
    
    res.redirect(trackingLinks[name]);
  } else {
    res.status(404).send('Link not found');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 PrepMCQ Tracker running at http://localhost:${PORT}`);
});