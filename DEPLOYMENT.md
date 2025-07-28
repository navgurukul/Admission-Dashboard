# Deployment Guide

## Branch Deployment Strategy

This project uses a dual-branch deployment strategy:

- **Dev Branch**: For testing and development
- **Master Branch**: For production deployment

## Automatic Deployment

The project uses GitHub Actions for automatic deployment:

### Dev Branch Deployment
- **Trigger**: Push to `dev` branch
- **URL**: `https://yourusername.github.io/repository-name/dev/`
- **Branch**: `gh-pages-dev`

### Master Branch Deployment  
- **Trigger**: Push to `master` or `main` branch
- **URL**: `https://yourusername.github.io/repository-name/`
- **Branch**: `gh-pages`

## Manual Deployment

If you need to deploy manually:

```bash
# Deploy dev branch
npm run deploy:dev

# Deploy master branch
npm run deploy:master
```

## Workflow

1. **Development**: Work on `dev` branch
2. **Testing**: Test on dev deployment URL
3. **Merge**: When ready, merge `dev` to `master`
4. **Production**: Master automatically deploys to production URL

## GitHub Pages Configuration

Make sure your GitHub repository settings are configured:

1. Go to Settings > Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` (for master) or `gh-pages-dev` (for dev)
4. Folder: `/ (root)`

## Troubleshooting

- If dev deployment fails, check the GitHub Actions tab
- Ensure you have write permissions to the repository
- Verify the branch names match your actual branch names 