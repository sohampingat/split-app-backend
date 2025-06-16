# 🚀 Deployment Guide - Split App Backend

## Option 1: Railway Deployment (Recommended)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Split App Backend"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Deploy to Railway
1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Node.js and deploy

### Step 3: Add Environment Variables
In Railway dashboard:
1. Go to Variables tab
2. Add:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `PORT`: (Railway sets this automatically)

### Step 4: Get Your Deployed URL
- Railway provides a URL like: `https://your-app-name.railway.app`
- Your API will be available at this URL

## Option 2: Render Deployment

### Step 1: Push to GitHub (same as above)

### Step 2: Deploy to Render
1. Go to [Render.com](https://render.com)
2. Connect your GitHub account
3. Create "New Web Service"
4. Select your repository
5. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

### Step 3: Add Environment Variables
In Render dashboard:
1. Go to Environment tab
2. Add your MongoDB URI

## Environment Variables Needed

```env
# Required for all deployments
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/splitapp?retryWrites=true&w=majority

# PORT is automatically set by hosting platforms
PORT=3000  # (Auto-set by Railway/Render)
```

## Testing Your Deployed API

Once deployed, test with:
```bash
# Replace YOUR_DEPLOYED_URL with actual URL
curl https://YOUR_DEPLOYED_URL/people

# Should return: {"success":true,"data":[]}
```

## MongoDB Atlas Setup (if not done)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free cluster
3. Create database user
4. Whitelist all IPs (0.0.0.0/0) for deployment
5. Get connection string
6. Replace `<username>`, `<password>`, and `<dbname>` in connection string

## Postman Collection Setup

1. After deployment, get your deployed URL
2. Update the `base_url` variable in Postman collection
3. Import the collection: `Split-App-Backend.postman_collection.json`
4. Test all endpoints!

## Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution**: Check your MongoDB Atlas connection string and network access settings

### Issue: "Application Error" 
**Solution**: Check environment variables are set correctly

### Issue: "Port already in use"
**Solution**: For deployment, hosting platforms handle ports automatically

## Sample Deployed URLs

After successful deployment, your API endpoints will be:
- `GET https://your-app.railway.app/people`
- `POST https://your-app.railway.app/expenses`
- `GET https://your-app.railway.app/balances`
- `GET https://your-app.railway.app/settlements`

## Quick Test Commands

```bash
# Replace YOUR_URL with actual deployed URL
export API_URL="https://your-app.railway.app"

# Test health
curl $API_URL/people

# Add sample expense
curl -X POST $API_URL/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 600,
    "description": "Test expense",
    "paid_by": "Shantanu",
    "split_among": ["Shantanu", "Sanket", "Om"]
  }'

# Check balances
curl $API_URL/balances
```

Happy Deploying! 🎉