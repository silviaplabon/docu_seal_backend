# DocuSeal Signature API

A Node.js Express server that provides a backend API for DocuSeal multiple signature functionality. This server acts as a proxy to the DocuSeal API, solving CORS issues and providing additional features like validation, error handling, and webhook support.

## 🚀 Features

- **CORS-free DocuSeal API access** - Eliminates browser CORS restrictions
- **Template Management** - Create, fetch, and manage DocuSeal templates
- **Multiple Signature Workflows** - Handle complex signing processes
- **Submission Management** - Create and track document submissions
- **Webhook Support** - Handle DocuSeal webhook events
- **Document Downloads** - Download completed signed documents
- **Rate Limiting** - Protect against abuse
- **Error Handling** - Comprehensive error handling and logging
- **Security** - Helmet, CORS, and input validation

## 📦 Installation

1. **Clone and navigate to the project:**
```bash
cd docuseal-api
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

4. **Edit the `.env` file with your configuration:**
```env
DOCUSEAL_API_KEY=your_docuseal_api_token_here
DOCUSEAL_API_BASE=https://api.docuseal.co
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8083,http://localhost:3000
```

5. **Start the server:**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOCUSEAL_API_KEY` | Your DocuSeal API token | **Required** |
| `DOCUSEAL_API_BASE` | DocuSeal API base URL | `https://api.docuseal.co` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:8083` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

### Getting Your DocuSeal API Key

1. Sign up at [DocuSeal](https://www.docuseal.co/)
2. Go to your dashboard
3. Navigate to **Settings** → **API**
4. Generate a new API token
5. Copy the token to your `.env` file

## 📋 API Endpoints

### Health Check
```http
GET /health
```
Returns server status and basic information.

### Templates
```http
GET /api/docuseal/templates
POST /api/docuseal/templates
GET /api/docuseal/templates/:id
```

### Submissions
```http
POST /api/docuseal/submissions
GET /api/docuseal/submissions
GET /api/docuseal/submissions/:id
DELETE /api/docuseal/submissions/:id
```

### Documents
```http
GET /api/docuseal/submissions/:id/download
```

### Webhooks
```http
POST /api/docuseal/webhooks
```

### Test
```http
GET /api/docuseal/test
```

## 💡 Usage Examples

### Create a Submission with Multiple Signers

```javascript
const response = await fetch('http://localhost:3001/api/docuseal/submissions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    template_id: 'template_123',
    send_email: true,
    submitters: [
      {
        role: 'Signer',
        email: 'john@example.com',
        name: 'John Doe',
        order: 1
      },
      {
        role: 'Witness',
        email: 'jane@example.com',
        name: 'Jane Smith',
        order: 2
      }
    ]
  })
});

const result = await response.json();
console.log('Submission created:', result);
```

### Fetch All Templates

```javascript
const response = await fetch('http://localhost:3001/api/docuseal/templates');
const templates = await response.json();
console.log('Available templates:', templates);
```

### Download Signed Document

```javascript
const response = await fetch('http://localhost:3001/api/docuseal/submissions/submission_id/download');
const blob = await response.blob();

// Create download link
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'signed-document.pdf';
link.click();
```

## 🔄 Frontend Integration

Update your frontend to use the API server:

```javascript
// In your React component
const API_BASE = 'http://localhost:3001/api/docuseal';

const fetchTemplates = async () => {
  try {
    const response = await fetch(`${API_BASE}/templates`);
    const templates = await response.json();
    setTemplates(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
  }
};

const createSubmission = async (submissionData) => {
  try {
    const response = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData)
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating submission:', error);
    throw error;
  }
};
```

## 🔗 Webhook Configuration

To receive real-time updates from DocuSeal:

1. **In your DocuSeal dashboard:**
   - Go to **Settings** → **Webhooks**
   - Add webhook URL: `https://your-server.com/api/docuseal/webhooks`
   - Select events: `submission.completed`, `submission.signed`, `submission.declined`

2. **The server will automatically handle webhook events:**
```javascript
// Webhook events are logged and can trigger custom logic
// Check routes/docuseal.js for webhook handling
```

## 🚀 Deployment

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start server.js --name "docuseal-api"

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### Using Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

USER node

CMD ["node", "server.js"]
```

### Environment Variables for Production

```bash
export DOCUSEAL_API_KEY="your_production_api_key"
export NODE_ENV="production"
export PORT="3001"
export ALLOWED_ORIGINS="https://your-frontend-domain.com"
```

## 🔍 Monitoring & Logging

The server includes comprehensive logging:

- **Request/Response logging** with timing
- **Error logging** with stack traces (development only)
- **Webhook event logging**
- **Health check endpoint** for monitoring

Example logs:
```
🚀 DocuSeal API Server running on port 3001
🔄 GET /api/docuseal/templates - 192.168.1.1
✅ GET /api/docuseal/templates - 200 - 145ms
📨 DocuSeal Webhook received: { event: 'submission.completed' }
```

## 🛡️ Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin request protection  
- **Rate Limiting** - Prevents abuse
- **Input Validation** - Validates required fields
- **Environment Variables** - Secure configuration
- **Error Handling** - No sensitive data exposure

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Add your frontend URL to `ALLOWED_ORIGINS`
   - Restart the server after changing environment variables

2. **API Key Issues:**
   - Verify your DocuSeal API key is correct
   - Check that the key has the required permissions

3. **Port Already in Use:**
   - Change the `PORT` environment variable
   - Kill existing process: `lsof -ti:3001 | xargs kill -9`

4. **Module Not Found:**
   - Run `npm install` to install dependencies
   - Check Node.js version (requires >= 16.0.0)

### Debug Mode

Run with debug output:
```bash
DEBUG=* npm run dev
```

## 📈 Performance

- **Compression** - Gzip compression for responses
- **Rate Limiting** - Prevents server overload
- **Efficient Error Handling** - Fast error responses
- **Stream Downloads** - Memory-efficient file downloads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

## 🎉 Quick Start Summary

1. `npm install`
2. Copy `.env.example` to `.env`
3. Add your DocuSeal API key
4. `npm run dev`
5. Visit `http://localhost:3001/health`

Your DocuSeal API server is now running and ready to handle multiple signature workflows! 🚀
