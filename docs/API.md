# API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

---

## Endpoints

### Authentication

#### Register User

**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input or user already exists
- `500 Internal Server Error` - Server error

---

#### Login

**POST** `/auth/login`

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "username": "johndoe",
  "email": "john@example.com"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `500 Internal Server Error` - Server error

---

### Tasks

All task endpoints require authentication (Bearer token).

#### Get All Tasks

**GET** `/tasks`

Retrieve all tasks for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "isCompleted": false,
    "createdAt": "2024-11-20T10:30:00Z",
    "completedAt": null,
    "userId": 1
  }
]
```

---

#### Get Task by ID

**GET** `/tasks/{id}`

Retrieve a specific task by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "isCompleted": false,
  "createdAt": "2024-11-20T10:30:00Z",
  "completedAt": null,
  "userId": 1
}
```

**Error Responses:**
- `404 Not Found` - Task not found or doesn't belong to user
- `401 Unauthorized` - Invalid or missing token

---

#### Create Task

**POST** `/tasks`

Create a new task.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "New task",
  "description": "Task description"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "title": "New task",
  "description": "Task description",
  "isCompleted": false,
  "createdAt": "2024-11-20T15:45:00Z",
  "completedAt": null,
  "userId": 1
}
```

---

#### Update Task

**PUT** `/tasks/{id}`

Update an existing task.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "isCompleted": true
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Updated title",
  "description": "Updated description",
  "isCompleted": true,
  "createdAt": "2024-11-20T10:30:00Z",
  "completedAt": "2024-11-20T16:00:00Z",
  "userId": 1
}
```

**Error Responses:**
- `404 Not Found` - Task not found
- `401 Unauthorized` - Invalid token

---

#### Delete Task

**DELETE** `/tasks/{id}`

Delete a task.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (204 No Content)**

**Error Responses:**
- `404 Not Found` - Task not found
- `401 Unauthorized` - Invalid token

---

### Health Check

#### Health Status

**GET** `/health`

Check API health status. No authentication required.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-20T12:00:00Z",
  "version": "1.0.0"
}
```

---

## Error Handling

All endpoints follow a consistent error response format:
```json
{
  "message": "Error description"
}
```

### HTTP Status Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently, no rate limiting is enforced, but it's recommended for production deployments.

---

## Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:5000/swagger
```

This provides a UI to test all endpoints directly.