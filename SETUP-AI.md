# Connecting real AI redesigns: step by step

This takes about 30 to 45 minutes, once. You will create three free accounts (OpenAI, GitHub, Vercel), add credit to OpenAI only, and paste two secret values into Vercel. You never need to install anything or type commands.

**Why this is needed.** Generating an image requires a secret OpenAI key. A secret can't live inside a web page, because anyone could read it. Vercel runs a tiny private server for your app, and only that server knows the key.

**Never paste your OpenAI key into Claude, into the app, into an email or into GitHub.** It goes in exactly one place: Vercel's Environment Variables (step 3).

## Step 1. OpenAI: account, credit, safety limit and key

1. Go to https://platform.openai.com and sign up (this is separate from a ChatGPT subscription).
2. Open **Settings, Billing** and add a payment method and a small amount of credit. A few dollars is plenty for testing: one Standard-quality redesign is estimated at about 6 US cents.
3. Open **Settings, Limits** and set a monthly budget you're comfortable with, for example $10. This caps what you can ever be charged.
4. Open **Settings, Organization, General**. If you see an option to **verify your organisation**, complete it. OpenAI may require this before its image models can be used; if you skip it, the app will show a clear message saying so.
5. Open **API keys** and choose **Create new secret key**. Name it "Euphoric Vision". Copy the key (it starts with `sk-`) into a temporary note on your own computer. OpenAI shows it only once.

## Step 2. GitHub: a private home for the project files

1. Go to https://github.com and sign up.
2. Choose **New repository**. Name it `euphoric-vision`, select **Private**, and create it.
3. Unzip `euphoric-vision.zip` on your computer.
4. On the new repository page, choose **uploading an existing file**, then drag everything from *inside* the unzipped `euphoric-vision` folder into the browser window. Wait for the files to finish uploading, then press **Commit changes**.

## Step 3. Vercel: put the app online with its private server

1. Go to https://vercel.com and choose **Sign up**, then **Continue with GitHub**. The free Hobby plan is fine for personal use. (If Euphoric Vision becomes a commercial product, Vercel's paid plan is required.)
2. Choose **Add New, Project**, then **Import** next to `euphoric-vision`.
3. Leave the build settings as Vercel suggests (it detects "Vite").
4. Open **Environment Variables** and add two entries:
   - Name `OPENAI_API_KEY`, value: the key from step 1.
   - Name `APP_ACCESS_CODE`, value: a password you invent, for example `blue-beach-cottage-73`. The app asks for this before generating, so strangers who find your web address can't spend your OpenAI credit.
5. Press **Deploy**. After a minute or two you get a web address such as `euphoric-vision-yourname.vercel.app`.
6. Delete the temporary note holding your key.

## Step 4. Your first real redesign

1. Open your Vercel web address. The top-right badge should read **AI connected**.
2. Set up your property and design plan (or use the sample project).
3. Go to **Redesign**, choose **Main bedroom** and add a real photo.
4. In the **AI redesign** panel, tick the box allowing the photo to be sent to OpenAI, enter your access code, and keep **Standard** quality.
5. Press **Generate Level 1 redesign**, check the cost, and confirm. Wait 20 to 90 seconds.
6. Repeat for Level 2 and Level 3, then use **Compare all levels**.

Your projects, photos and redesigns are stored in the browser you use, so the Vercel app starts empty the first time; it won't show what you entered in the Claude preview.

## If something goes wrong

The app explains every failure in plain words. The common ones:

- **"OpenAI rejected the API key"**: the key was pasted incorrectly. In Vercel, open Settings, Environment Variables, fix it, then Deployments, Redeploy.
- **"May need to complete verification"**: finish step 1.4.
- **"No credit left or reached its spending limit"**: add credit or raise the limit (steps 1.2 and 1.3).
- **"Almost connected"**: one of the two Vercel settings is missing; add it and redeploy.
- **"Access code is missing or incorrect"**: re-enter the code you chose in step 3.4.

If you ever think your key has been seen by someone else, delete it in OpenAI's API keys page, create a new one, and replace it in Vercel.

## What it costs

- **Confirmed.** OpenAI's pricing page (checked 24 October 2026) bills `gpt-image-2.5-sunburst` per million tokens: $8 for image input, $30 for image output and $5 for text.
- **Estimated.** Per image, that works out to roughly $0.06 at Standard quality and $0.19 at High, for a landscape room photo. These are estimates, not a fixed price list. After each generation, the app shows the cost worked out from the token counts OpenAI reports.
- **Rand figures** use an assumed rate of R18 to the dollar, not a live rate.
- **GitHub and Vercel** are free for personal use.

Testing all three levels for one room at Standard quality should cost roughly 20 US cents.
