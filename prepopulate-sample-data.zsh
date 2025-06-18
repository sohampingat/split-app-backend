#!/bin/zsh
# Pre-populate Split App Backend with sample data
API_URL="https://split-app-backend-production.up.railway.app"

echo "Adding Dinner (₹600, paid by Shantanu)"
curl -s -X POST $API_URL/expenses \
  -H "Content-Type: application/json" \
  -d '{"amount":600,"description":"Dinner at restaurant","paid_by":"Shantanu","split_among":["Shantanu","Sanket","Om"]}'
echo "\n---"

echo "Adding Groceries (₹450, paid by Sanket)"
curl -s -X POST $API_URL/expenses \
  -H "Content-Type: application/json" \
  -d '{"amount":450,"description":"Groceries","paid_by":"Sanket","split_among":["Shantanu","Sanket","Om"]}'
echo "\n---"

echo "Adding Petrol (₹300, paid by Om)"
curl -s -X POST $API_URL/expenses \
  -H "Content-Type: application/json" \
  -d '{"amount":300,"description":"Petrol","paid_by":"Om","split_among":["Shantanu","Sanket","Om"]}'
echo "\n---"

echo "Adding Movie Tickets (₹500, paid by Shantanu)"
curl -s -X POST $API_URL/expenses \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"description":"Movie Tickets","paid_by":"Shantanu","split_among":["Shantanu","Sanket","Om"]}'
echo "\n---"

echo "Adding Pizza (₹280, paid by Sanket)"
curl -s -X POST $API_URL/expenses \
  -H "Content-Type: application/json" \
  -d '{"amount":280,"description":"Pizza","paid_by":"Sanket","split_among":["Shantanu","Sanket","Om"]}'
echo "\n---"

echo "Sample data population complete!"
