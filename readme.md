# Bulk Processing System

## 📌 Overview

This project is a bulk processing system that allows performing **bulk operations in chunks** while ensuring **rate-limiting per account ID**. The system uses **Bull queue** for background processing and **Redis** for rate limiting. All operations are validated, and failed records are stored separately.

---

## 🛠️ Tech Stack

- **Node.js** (Express)
- **MongoDB** (Mongoose ODM)
- **Redis** (For rate limiting)
- **Bull** (For job queue management)

---

## 📦 Installation

1. **Clone the Repository**
   ```sh
   git clone https://github.com/your-repo.git
   cd bulk-processing
   ```
2. **Install Dependencies**
   ```sh
   npm install
   ```
3. **Start Redis & MongoDB**
   ```sh
   redis-server
   mongod
   ```
4. **Run the Application**
   ```sh
   npm start
   ```

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the root directory and add:

```env
MONGO_URI=mongodb://localhost:27017/bulkDB
REDIS_URL=redis://localhost:6379
PORT=3000
RECORDS_TO_PROCESS_PER_MIN=10
REQUEUE_IN_SECONDS=60
```

---

## 🚀 API Endpoints

### 1️⃣ **Submit Bulk Request**

#### **POST /api/bulk**

Submit a bulk request for insert, update, or delete.

**Request Body:**

```json
{
  "accountId": "12345",
  "operationType": "insert", // update
  "records": [
    { "name": "John Doe", "email": "john@example.com" },
    { "name": "Jane Doe", "email": "jane@example.com" }
  ]
}
```

**Response:**

```json
{
  "message": "Bulk request submitted successfully"
}
```

---

## 🏗️ How It Works

1. The API receives a **bulk request** (insert/update/delete).
2. The **worker processes** the records in the queue using **Bull**.
3. **Rate limiting** ensures that no account processes more than **10 records per minute**.
4. Valid records are stored in the **Records collection**.
5. Invalid records are stored in the **FailedRecords collection**.

---

## 🛠️ Key Features

✅ **Process records in chunks** to optimize DB operations.  
✅ **Rate-limiting per account** (Max 10 records per minute).  
✅ **Single queue for all bulk operations** (no separate queues per account).  
✅ **Validations for unique keys & missing fields**.  
✅ **Failed records stored separately**.

