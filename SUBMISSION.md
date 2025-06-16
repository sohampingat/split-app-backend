# 🧾 Split App Backend - Assignment Submission

## 🚀 **Deployed API**
- **Live URL**: https://split-app-backend-production.up.railway.app
- **Status**: ✅ Live and functional
- **Database**: MongoDB Atlas (hosted)

## 📋 **Postman Collection**
- **GitHub Gist**: [Replace with your Gist URL]
- **Collection Name**: Split App Backend - Expense Splitter APIs
- **Test Data**: Pre-populated with Shantanu, Sanket, Om scenarios
- **Status**: ✅ All endpoints tested and working

## ✅ **Completed Requirements**

### **MUST HAVE Features**
- [x] **Expense Tracking**
  - Add new expenses with amount, description, and payer
  - People automatically added when mentioned
  - View all expenses with complete details
  - Edit or delete existing expenses
  - Support for percentage/share/exact amount splits

- [x] **Settlement Calculations**
  - Calculate spending vs fair share for each person
  - Determine who owes money and who receives money
  - Show simplified settlements (minimized transactions)
  - Clear summary of who pays whom and how much

- [x] **Data Validation & Error Handling**
  - Validate all inputs (positive amounts, required fields)
  - Handle edge cases gracefully
  - Return clear, helpful error messages
  - Proper HTTP status codes

### **API Endpoints**
- [x] `GET /expenses` - List all expenses
- [x] `POST /expenses` - Add new expense
- [x] `PUT /expenses/:id` - Update expense
- [x] `DELETE /expenses/:id` - Delete expense
- [x] `GET /settlements` - Get settlement summary
- [x] `GET /balances` - Show each person's balance
- [x] `GET /people` - List all people

### **Deployment & Testing**
- [x] Public Postman collection with working examples
- [x] Deployed backend with online database
- [x] All APIs work immediately upon import
- [x] Pre-populated with sample data (Shantanu, Sanket, Om)
- [x] Settlement calculations show realistic results

## 🛠️ **Tech Stack Used**
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Deployment**: Railway.app
- **Testing**: Postman

## 🧮 **Settlement Algorithm**
The settlement calculation uses a greedy algorithm that:
1. Calculates net balance for each person (paid - owed)
2. Separates people into debtors and creditors
3. Matches debtors with creditors to minimize transactions
4. Handles floating-point precision for accurate money calculations

## 📊 **Sample Calculation**
With expenses:
- Dinner ₹600 (paid by Shantanu, split 3 ways = ₹200 each)
- Groceries ₹450 (paid by Sanket, split 3 ways = ₹150 each)
- Petrol ₹300 (paid by Om, split 3 ways = ₹100 each)

**Balances**:
- Shantanu: +₹150 (paid ₹600, owes ₹450)
- Sanket: +₹0 (paid ₹450, owes ₹450)
- Om: -₹150 (paid ₹300, owes ₹450)

**Settlement**: Om pays ₹150 to Shantanu

## 🎯 **Key Features Demonstrated**
- **Smart Splitting**: Both equal splits and custom splits
- **Optimized Settlements**: Minimal transaction recommendations
- **Robust Validation**: Comprehensive error handling
- **Money Precision**: Proper floating-point handling
- **Production Ready**: Deployed with proper environment setup

---

**Assignment completed successfully!** ✅

The system handles all required scenarios and edge cases, with comprehensive testing available through the provided Postman collection.