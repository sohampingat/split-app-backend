# Split App Backend 💰

A comprehensive backend system for managing group expenses and calculating settlements - helping friends, roommates, and travel buddies split costs fairly.

## 🚀 Features

### Core Functionality
- **Expense Management**: Add, edit, delete, and view expenses
- **Smart Splitting**: Support for equal splits, custom splits, and percentage-based splits
- **Automatic Settlement**: Calculate optimal settlements to minimize transactions
- **People Management**: Automatically track people from expenses
- **Balance Tracking**: View how much each person owes or is owed

### Key Highlights
- **Flexible Splitting Options**: Equal splits, custom amounts, or percentage-based
- **Smart Settlement Algorithm**: Minimizes the number of transactions needed
- **Floating Point Precision**: Handles money calculations correctly
- **Comprehensive Validation**: Robust input validation and error handling
- **RESTful API**: Clean, consistent API design

## 🛠️ Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB Atlas (cloud-hosted)
- **Deployment**: Railway (free hosting)
- **Testing**: Postman collection provided

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas (cloud, free tier)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sohampingat/split-app-backend.git
   cd split-app-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_URI=your-mongodb-atlas-connection-string
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 📋 Postman Collection

- **Public Gist:** https://gist.github.com/sohampingat/586b2b4448d118534d90d55b3a68c276
- **Base URL:** https://split-app-backend-production.up.railway.app
- **How to use:** Import the collection into Postman and test all endpoints with pre-populated data (Shantanu, Sanket, Om).

## 🔧 API Endpoints

### Expense Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/expenses` | Get all expenses |
| POST | `/expenses` | Add new expense |
| PUT | `/expenses/:id` | Update expense |
| DELETE | `/expenses/:id` | Delete expense |

### Settlement & People

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/people` | Get all people |
| GET | `/balances` | Get current balances |
| GET | `/settlements` | Get settlement recommendations |

## 📋 API Usage Examples

### Adding an Expense

#### Option 1: Equal Split
```json
POST /expenses
{
  "amount": 600,
  "description": "Dinner at restaurant",
  "paid_by": "Shantanu",
  "split_among": ["Shantanu", "Sanket", "Om"]
}
```

#### Option 2: Custom Split
```json
POST /expenses
{
  "amount": 600,
  "description": "Dinner at restaurant",
  "paid_by": "Shantanu",
  "splits": [
    { "person": "Shantanu", "share": 200 },
    { "person": "Sanket", "share": 200 },
    { "person": "Om", "share": 200 }
  ]
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "_id": "64...",
    "amount": 600,
    "description": "Dinner at restaurant",
    "paid_by": "Shantanu",
    "splits": [
      { "person": "Shantanu", "share": 200 },
      { "person": "Sanket", "share": 200 },
      { "person": "Om", "share": 200 }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Expense added successfully"
}
```

### Getting Settlements
```json
GET /settlements
{
  "success": true,
  "data": [
    {
      "from": "Sanket",
      "to": "Shantanu",
      "amount": 150.00
    },
    {
      "from": "Om",
      "to": "Shantanu",
      "amount": 100.00
    }
  ]
}
```

## 🧮 Settlement Calculation Logic

The settlement algorithm works in three steps:

1. **Calculate Balances**: For each person, calculate total paid minus total owed
2. **Identify Debtors & Creditors**: Separate people into those who owe money and those who are owed money
3. **Optimize Settlements**: Use a greedy algorithm to minimize the number of transactions

### Example:
- **Shantanu**: Paid ₹600 + ₹500 = ₹1100, Owes ₹400 → Balance: +₹700
- **Sanket**: Paid ₹450, Owes ₹400 → Balance: +₹50  
- **Om**: Paid ₹300, Owes ₹500 → Balance: -₹200

**Optimized Settlement**: Om pays ₹200 to Shantanu (instead of multiple transactions)

## 🔍 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Server Error

## 🧪 Testing

### Using Postman
1. Import the provided Postman collection
2. Set the base URL to your deployed API or `http://localhost:5000`
3. Run the pre-configured test scenarios

### Test Scenarios Included:
- Adding expenses with different split types
- Updating and deleting expenses
- Calculating balances and settlements
- Error handling for invalid inputs

## 🚀 Deployment

### Railway Deployment
1. Push your code to GitHub
2. Connect Railway to your repository
3. Add environment variables in Railway dashboard
4. Deploy!

### Render Deployment
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables
5. Deploy!

## 📊 Database Schema

### Expense Model
```javascript
{
  amount: Number,        // Required, positive
  description: String,   // Required
  paid_by: String,      // Required
  splits: [{
    person: String,     // Required
    share: Number       // Required, non-negative
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔮 Future Enhancements

- [ ] Recurring expenses
- [ ] Expense categories
- [ ] Monthly/yearly summaries
- [ ] Export functionality
- [ ] User authentication
- [ ] Group management
- [ ] Mobile app integration

## ⚠️ Known Limitations & Assumptions

- No authentication or user accounts (all names are plain strings)
- Names are case-sensitive ("Shantanu" ≠ "shantanu")
- No group management (all expenses are in a single pool)
- No recurring expenses or categories (see Future Enhancements)
- No pagination or filtering on expense list
- No frontend included in this submission (backend only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email soham.pingat22@vit.edu or create an issue in the repository.

---

**Made with ❤️ for splitting expenses fairly!**
