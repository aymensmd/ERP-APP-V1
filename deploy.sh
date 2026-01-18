#!/bin/bash

# Deploy Script for ERP SaaS

echo "Deploying ERP SaaS..."

# Backend
echo "Setting up Backend..."
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
php artisan scribe:generate
cd ..

# Frontend
echo "Building Frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Deployment Complete!"
