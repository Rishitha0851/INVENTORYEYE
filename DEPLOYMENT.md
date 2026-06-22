# Deployment Documentation for InventoryEye

This guide provides step-by-step instructions for deploying the InventoryEye application to production environments.

## 1. MongoDB Atlas (Database)

1. Navigate to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free tier cluster.
2. Under "Database Access", create a new database user with a secure password.
3. Under "Network Access", add `0.0.0.0/0` to allow connections from anywhere (required for Render serverless IPs).
4. Click "Connect" -> "Drivers" -> "Node.js" and copy your Connection String URI.
5. Replace `<password>` in the URI with your database user's password. Keep this URI handy for the Backend deployment.

## 2. GitHub (Version Control)

Before deploying to cloud services, your code must be pushed to a GitHub repository.

1. Create a new repository on GitHub (e.g., `inventory-eye`).
2. Open a terminal at the root of your project (`C:\Users\rishi\IE\InventoryEye`).
3. Run the following commands:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: InventoryEye ready for production"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/inventory-eye.git
   git push -u origin main
   ```
*(Note: Our `.gitignore` automatically prevents `.env` and `node_modules` from being uploaded).*

## 3. Render (Backend Deployment)

We will use Render to host the Node.js/Express API. A `render.yaml` blueprint has been included for easy setup.

1. Create an account on [Render](https://render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub account and select your `inventory-eye` repository.
4. **Configuration Settings**:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Environment Variables**:
   - `MONGO_URI`: *<Paste your MongoDB Atlas Connection String>*
   - `JWT_SECRET`: *<Enter a random secure string>*
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
6. Click **Create Web Service**. Render will now build and deploy your backend.
7. Once deployed, copy your Render URL (e.g., `https://inventoryeye-api.onrender.com`).

## 4. Vercel (Frontend Deployment)

We will use Vercel to host the React/Vite single-page application. A `vercel.json` config is included to handle client-side routing.

### Step 4A: Update Frontend API URL
Before deploying the frontend, you must point it to your live Render backend.
1. Open `frontend/src/services/api.js`.
2. Change the `baseURL` to point to your live backend. For example:
   ```javascript
   const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL || 'https://inventoryeye-api.onrender.com/api',
   });
   ```
3. Commit and push this change to GitHub.

### Step 4B: Deploy to Vercel
1. Create an account on [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Import your `inventory-eye` GitHub repository.
4. In the configuration screen:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (Click Edit and select the `frontend` folder).
5. Click **Deploy**. Vercel will run `npm run build` and automatically publish your site.

## 5. Post-Deployment Verification
1. Visit your Vercel frontend URL.
2. Attempt to register a new user or log in.
3. Check the "Reports" tab to ensure the server automatically seeded the AI Forecasts using your MongoDB Atlas cluster.
