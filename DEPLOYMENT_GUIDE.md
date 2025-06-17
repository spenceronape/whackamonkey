# Whack-A-Monkey Deployment Guide

## Overview
This guide covers deploying the subgraph to Goldsky and testing the admin panel integration.

## Prerequisites

### 1. Install Graph CLI
```bash
npm install -g @graphprotocol/graph-cli
```

### 2. Get Goldsky Access Token
1. Go to [Goldsky Dashboard](https://app.goldsky.com/)
2. Create a new project or use existing project
3. Get your access token from the project settings

### 3. Install Subgraph Dependencies
```bash
cd subgraph
npm install
```

## Subgraph Deployment

### 1. Authenticate with Goldsky
```bash
graph auth --product hosted-service <YOUR_GOLDSKY_ACCESS_TOKEN>
```

### 2. Generate Types
```bash
cd subgraph
npm run codegen
```

### 3. Build Subgraph
```bash
npm run build
```

### 4. Deploy to Goldsky
```bash
npm run deploy
```

### 5. Verify Deployment
After deployment, you'll get a URL like:
```
https://api.goldsky.com/api/public/project_cm8grmwci3q4001w1e6mz7wzu/subgraphs/whack-a-monkey/1.0.1/gn
```

## Frontend Integration

### 1. Update Subgraph URL (if needed)
If the deployment URL changes, update it in:
```typescript
// src/utils/subgraph.ts
const SUBGRAPH_URL = 'YOUR_NEW_SUBGRAPH_URL';
```

### 2. Test Admin Panel
1. Start the development server:
```bash
$env:SIGNER_PRIVATE_KEY="0x1234567890123456789012345678901234567890123456789012345678901234"; npm run dev
```

2. Open http://localhost:3000
3. Connect with admin wallet: `0x4d6f6f4ef5e5f74074Ad0798CE44436491750A2E`
4. Click "Admin Panel" button
5. Verify analytics dashboard loads

## Expected Behavior

### Before Subgraph Deployment
- Admin panel shows warning about subgraph data
- Configuration controls work normally
- Analytics section shows loading state

### After Subgraph Deployment
- Analytics dashboard displays real-time data
- Recent activity tables show actual game data
- Statistics cards show current metrics

## Troubleshooting

### Subgraph Deployment Issues
1. **Authentication Error**: Verify your Goldsky access token
2. **Build Errors**: Check that all dependencies are installed
3. **Deployment Fails**: Ensure contract address is correct in subgraph.yaml

### Frontend Integration Issues
1. **Subgraph URL Error**: Verify the URL in subgraph.ts
2. **CORS Issues**: Goldsky should handle CORS automatically
3. **Data Not Loading**: Check browser console for errors

### TypeScript Errors
The subgraph TypeScript errors are expected and will be resolved after:
1. Running `npm run codegen` in the subgraph directory
2. Deploying the subgraph successfully

## Monitoring

### Subgraph Health
- Monitor subgraph indexing status in Goldsky dashboard
- Check for failed events or indexing errors
- Verify data is being indexed correctly

### Admin Panel Analytics
- Verify real-time data updates
- Check that all statistics are calculating correctly
- Monitor for any API rate limiting

## Security Considerations

### Admin Access
- Only the admin wallet can access the admin panel
- Admin wallet must be added as operator by contract owner
- All configuration changes are logged in subgraph

### Data Privacy
- Subgraph data is public and transparent
- Player addresses are visible but no personal information
- Game scores and prizes are publicly verifiable

## Performance Optimization

### Query Optimization
- Use pagination for large datasets
- Implement caching for frequently accessed data
- Monitor query performance in Goldsky dashboard

### Frontend Optimization
- Implement loading states for better UX
- Add error boundaries for graceful failures
- Consider implementing data refresh intervals

## Next Steps

1. **Deploy Subgraph**: Follow the deployment steps above
2. **Test Integration**: Verify admin panel works with real data
3. **Monitor Performance**: Track subgraph indexing and query performance
4. **Add Features**: Consider additional analytics and visualizations

## Support

For issues with:
- **Subgraph Deployment**: Check Goldsky documentation
- **Frontend Integration**: Review browser console and network tab
- **Contract Integration**: Verify contract events are firing correctly

The integration provides a powerful analytics solution for managing the Whack-A-Monkey game with real-time data and comprehensive monitoring capabilities. 