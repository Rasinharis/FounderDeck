#!/bin/bash

cd "$(dirname "$0")" || exit

echo "Setting up FounderDeck Laravel Backend..."

# 1. Check PHP version
PHP_VERSION=$(php -r "echo PHP_VERSION;" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ PHP Version: $PHP_VERSION"
    if php -r "exit(version_compare(PHP_VERSION, '8.2.0', '>=') ? 0 : 1);"; then
        echo "✅ PHP version is 8.2+"
    else
        echo "❌ ERROR: PHP 8.2 or higher is required!"
        exit 1
    fi
else
    echo "❌ ERROR: PHP is not installed or not in PATH."
    exit 1
fi

# 2. Check Composer
COMPOSER_VERSION=$(composer --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Composer installed: $COMPOSER_VERSION"
else
    echo "❌ ERROR: Composer is not installed or not in PATH."
    exit 1
fi

# 3. Install dependencies
echo "Running composer install..."
composer install
if [ $? -eq 0 ]; then
    echo "✅ Composer dependencies installed."
else
    echo "❌ ERROR: Composer install failed."
    exit 1
fi

# 4. Generate App Key if empty
if grep -q "APP_KEY=$" .env; then
    echo "Generating APP_KEY..."
    php artisan key:generate
    echo "✅ APP_KEY generated."
fi

# 5. Check PostgreSQL connection
echo "Checking database connection..."
php artisan db:show > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful."
else
    echo "❌ DATABASE CONNECTION FAILED!"
    echo "Please check DB_PASSWORD in .env and ensure your PostgreSQL service is running."
    exit 1
fi

# 6. Migrate
echo "Running migrations..."
php artisan migrate --force
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed."
else
    echo "❌ ERROR: Migrations failed."
    exit 1
fi

# 7. Seed Super Admin
echo "Seeding database..."
php artisan db:seed --class=SuperAdminSeeder
echo "✅ Database seeding completed."

# 8. Queue table
echo "Setting up queue..."
php artisan queue:table > /dev/null 2>&1 || true
php artisan migrate > /dev/null 2>&1
echo "✅ Queue table setup."

# 9. Storage link
echo "Linking storage..."
php artisan storage:link
echo "✅ Storage linked."

echo ""
echo "Backend ready! Run these 4 commands in 4 separate terminals (inside the founderdeck-api/ directory):"
echo "1. php artisan serve --port=8000"
echo "2. php artisan queue:work --tries=3"
echo "3. php artisan reverb:start --port=8080"
echo "4. php artisan schedule:work"
