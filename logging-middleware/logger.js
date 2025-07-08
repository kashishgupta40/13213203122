// logging-middleware/logger.js
const axios = require('axios');

// Your valid token
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJndXB0YWthc2hpc2hpaXQ0MEBnbWFpbC5jb20iLCJleHAiOjE3NTE5NTcyMzEsImlhdCI6MTc1MTk1NjMzMSwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6ImJhMjMxZjg0LWJkMjMtNGE1OC1hM2ZkLWJjY2Q1OWJiMzE0MiIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6Imthc2hpc2ggZ3VwdGEiLCJzdWIiOiJmMjI3MjBiZi02ODFhLTQ0YmYtOWQ5Ni1iMTZmNjM2N2M0NWMifSwiZW1haWwiOiJndXB0YWthc2hpc2hpaXQ0MEBnbWFpbC5jb20iLCJuYW1lIjoia2FzaGlzaCBndXB0YSIsInJvbGxObyI6IjEzMjEzMjAzMTIyIiwiYWNjZXNzQ29kZSI6IlZQcHNtVCIsImNsaWVudElEIjoiZjIyNzIwYmYtNjgxYS00NGJmLTlkOTYtYjE2ZjYzNjdjNDVjIiwiY2xpZW50U2VjcmV0IjoiZXpYRWJFYXpyQ05ibWhCciJ9.4jU7MXtBmHDZfcIicrVzgbZsLTiADSYzipW9vmrfPfk";

const MAX_MESSAGE_LENGTH = 48;

const log = async (stack, level, pkg, message) => {
  let truncatedMessage = message;

  if (message && message.length > MAX_MESSAGE_LENGTH) {
    truncatedMessage = message.substring(0, MAX_MESSAGE_LENGTH - 3) + "...";
    console.warn(`Log message truncated from ${message.length} to ${truncatedMessage.length} characters.`);
  }

  try {
    const res = await axios.post("http://20.244.56.144/evaluation-service/logs", {
      stack,
      level,
      package: pkg,
      message: truncatedMessage
    }, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    });
    // Optionally print: console.log("Log sent:", res.data);
  } catch (error) {
    console.error("Logging error (could not send to external service):", error.message);
    if (error.response) {
      console.error("Error Response Data:", error.response.data);
      console.error("Error Response Status:", error.response.status);
    }
  }
};

module.exports = log;
