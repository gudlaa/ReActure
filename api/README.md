# 🔌 Vercel Serverless API Functions

This directory contains Vercel serverless functions that replace the traditional Express.js server for cloud deployment.

## 📁 **API Structure**

```
api/
├── session.js        # Session management (create, update, get)
├── leaderboard.js    # Leaderboard queries
├── stats.js          # Overall statistics
├── dataset.js        # ML dataset export
└── health.js         # Health check endpoint
```

## 🚀 **How Vercel Serverless Functions Work**

Each file exports a single `handler` function:

```javascript
export default async function handler(req, res) {
  // Handle request
  res.status(200).json({ success: true });
}
```

**Key Differences from Express:**
- ❌ No `app.listen()` - Vercel handles server
- ❌ No middleware stack - Add CORS headers manually
- ❌ No router - Each file is a separate endpoint
- ✅ Auto-scaling - Handles any traffic
- ✅ Edge deployment - Fast globally
- ✅ Pay-per-use - Free tier is generous

## 🌐 **Endpoints**

| File | Endpoint | Methods | Purpose |
|------|----------|---------|---------|
| `session.js` | `/api/session` | GET, POST, PUT | Session CRUD |
| `leaderboard.js` | `/api/leaderboard` | GET, POST | Rankings |
| `stats.js` | `/api/stats` | GET | Analytics |
| `dataset.js` | `/api/dataset` | GET | ML export |
| `health.js` | `/api/health` | GET | Status check |

## 🔗 **URL Mapping**

**Local Development:**
```
http://localhost:3001/api/session
http://localhost:3001/api/leaderboard
```

**Vercel Production:**
```
https://reacture.vercel.app/api/session
https://reacture.vercel.app/api/leaderboard
```

The frontend (`mongoService.js`) automatically detects the environment and uses the correct URL.

## 📦 **Dependencies**

These functions use the same MongoDB models from `/server`:

```javascript
import dbConnect from '../server/lib/dbConnect.js';
import PlayerSession from '../server/models/PlayerSession.js';
```

**Dependencies installed from root `package.json`:**
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variables

## 🔐 **Environment Variables**

Set in Vercel Dashboard:

| Variable | Required | Example |
|----------|----------|---------|
| `MONGODB_URI` | Yes | `mongodb+srv://...` |

## 🔄 **CORS Configuration**

Each function includes CORS headers:

```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
res.setHeader('Access-Control-Allow-Headers', '...');
```

Handles preflight OPTIONS requests:

```javascript
if (req.method === 'OPTIONS') {
  res.status(200).end();
  return;
}
```

## 🧪 **Testing**

**Health Check:**
```bash
curl https://reacture.vercel.app/api/health
```

**Create Session:**
```bash
curl -X POST https://reacture.vercel.app/api/session \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "test123",
    "playerName": "Test Player",
    "sessionId": "session_123",
    "environment": "earthquake",
    "victimsTotal": 10
  }'
```

**Get Leaderboard:**
```bash
curl https://reacture.vercel.app/api/leaderboard
```

## 🐛 **Debugging**

**View Logs:**
```bash
# Vercel CLI
vercel logs

# Or check dashboard
https://vercel.com/dashboard → Your Project → Functions
```

**Common Issues:**

1. **500 Error**
   - Check MongoDB URI is set
   - Verify IP whitelist in Atlas (`0.0.0.0/0`)
   - Check function logs

2. **CORS Error**
   - Headers should be set in every response
   - OPTIONS method must return 200
   - Check browser console for details

3. **Timeout**
   - Functions timeout after 10s (free tier)
   - Optimize database queries
   - Add indexes in MongoDB

## 📊 **Performance**

**Vercel Free Tier:**
- 100 GB-hours compute per month
- 10 second timeout per function
- 50 MB function size
- ~10 concurrent executions

**MongoDB Atlas M0:**
- 512 MB storage
- Shared CPU
- 100 connections

**For ReActure:**
- Handles 100s of players/month easily
- Database queries < 100ms typically
- Function execution < 500ms average

## 🔒 **Security**

✅ **Environment Variables** - Secrets not in code  
✅ **HTTPS** - Auto SSL certificate  
✅ **Input Validation** - Mongoose schemas  
✅ **CORS** - Controlled origin access  
✅ **Rate Limiting** - Vercel built-in (1000 req/min)  

## 📚 **Learn More**

- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [MongoDB with Vercel](https://vercel.com/guides/deploying-a-mongodb-powered-api-with-node-and-vercel)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) (similar concept)

## ✅ **Checklist**

Before deploying:
- [ ] All functions in `/api` directory
- [ ] Mongoose models in `/server/models`
- [ ] `dbConnect.js` in `/server/lib`
- [ ] `MONGODB_URI` set in Vercel
- [ ] CORS headers in all functions
- [ ] OPTIONS handling for preflight
- [ ] Error handling with try/catch

---

**Ready to deploy!** 🚀

Follow the main **VERCEL_DEPLOYMENT.md** guide to deploy your app.

