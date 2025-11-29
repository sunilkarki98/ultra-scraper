#!/bin/bash
# Script to make a user admin via Prisma Studio or SQL

echo "🔧 Make User Admin"
echo "=================="
echo ""
echo "Choose a method:"
echo "1. Via TypeScript script (recommended)"
echo "2. Via Prisma Studio (GUI)"
echo "3. Via direct SQL"
echo ""

read -p "Enter choice (1-3): " choice

case $choice in
    1)
        read -p "Enter user email: " email
        cd "$(dirname "$0")/.."
        npx ts-node scripts/make-admin.ts "$email"
        ;;
    2)
        echo "Opening Prisma Studio..."
        echo "Navigate to User table and change 'role' field to 'admin'"
        cd "$(dirname "$0")/.."
        npx prisma studio
        ;;
    3)
        read -p "Enter user email: " email
        echo ""
        echo "Run this SQL command in your database:"
        echo ""
        echo "UPDATE \"User\" SET role = 'admin' WHERE email = '$email';"
        echo ""
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
