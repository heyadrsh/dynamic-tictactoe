# 🚀 Deploying ShiftTac to Vercel

This guide explains how to deploy ShiftTac to Vercel with environment variable support for your Gemini API key.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Gemini API Key**: Get yours from [Google AI Studio](https://ai.google.dev/)
3. **Git Repository**: Your code should be in a GitHub/GitLab/Bitbucket repository

## 🔧 Setup Steps

### 1. Prepare Your Repository

Ensure your repository has these new files:
- `vercel.json` - Vercel configuration
- `build.js` - Build script that injects environment variables
- `env.example` - Example environment file

### 2. Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel will automatically detect the configuration
4. **Don't deploy yet** - first set up environment variables

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts
```

### 3. Configure Environment Variables

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add a new environment variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key (e.g., `AIzaSyDsNoQfLs93EcPC4Oz4WuxlLbiHg2vqbTo`)
   - **Environments**: Select `Production`, `Preview`, and `Development`

3. Click **Save**

### 4. Redeploy

After adding the environment variable:
- Click **Deployments** in your Vercel dashboard
- Click **Redeploy** on the latest deployment
- Or push a new commit to trigger automatic deployment

## 🎮 How It Works

1. **Build Process**: The `build.js` script runs during deployment
2. **Environment Injection**: Your API key is securely injected into the client code
3. **Fallback**: If no API key is found, the game shows the modal for manual entry
4. **Security**: API keys are encrypted at rest and only visible to project members

## 🔄 Local Development

For local development with environment variables:

1. Copy the example file:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and add your API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. Run the build script:
   ```bash
   npm run build
   ```

4. Serve the `dist` folder:
   ```bash
   npx http-server dist -p 3000
   ```

## 🔍 Troubleshooting

### API Key Not Working
- Check that the environment variable is set correctly in Vercel
- Ensure you've redeployed after adding the variable
- Verify the API key is valid at [Google AI Studio](https://ai.google.dev/)

### Build Failing
- Check build logs in Vercel dashboard
- Ensure `build.js` has proper permissions
- Verify all files are committed to your repository

### Game Shows Modal Despite API Key
- Check browser console for errors
- Verify the API key was injected during build (check source code)
- Try a hard refresh (Ctrl+F5 or Cmd+Shift+R)

## 📝 Environment Variable Limits

Per [Vercel's documentation](https://vercel.com/docs/environment-variables):
- Total size limit: 64 KB for all variables combined
- Perfect for API keys, JWTs, and certificates
- Variables are encrypted at rest

## 🚀 Production Checklist

- [ ] Environment variable `GEMINI_API_KEY` is set
- [ ] API key is valid and working
- [ ] Game loads without showing API key modal
- [ ] AI functionality works correctly
- [ ] All animations and features function properly

Your ShiftTac game should now be live on Vercel with secure environment variable support! 🎉 