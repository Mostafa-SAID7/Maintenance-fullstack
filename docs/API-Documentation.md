# CarMaintenance API - Complete Documentation

## Overview
The CarMaintenance API is a comprehensive RESTful API built with ASP.NET Core 9.0 that provides full CRUD operations for car maintenance management with advanced features like predictive maintenance, notifications, and real-time communication.

## Base Information
- **Base URL**: `https://localhost:5001/api` (Development)
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer Token
- **API Versioning**: v1, v2

## Authentication

### JWT Token Authentication
All endpoints (except health checks) require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer {your-jwt-token}
```

### Login Endpoint
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2024-01-01T12:00:00Z",
    "user": {
      "id": "1",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

## Common Response Models

### Standard API Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "errors": [],
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Paged Response
```json
{
  "success": true,
  "data": [],
  "currentPage": 1,
  "pageSize": 20,
  "totalCount": 100,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": [
    "Make is required",
    "Model is required"
  ],
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Health Check Endpoints

### Basic Health Check
```
GET /api/health/basic
```

### Detailed Health Check
```
GET /api/health/detailed
```

### Database Health Check
```
GET /api/health/database
```

## Car Management Endpoints

### Get All Cars (Paged)
```
GET /api/cars?pageNumber=1&pageSize=20&sortBy=make&sortDirection=asc
```

### Get Car by ID
```
GET /api/cars/{id}
```

### Create New Car
```
POST /api/cars
```

### Update Car
```
PUT /api/cars/{id}
```

### Delete Car
```
DELETE /api/cars/{id}
```

## Owner Management Endpoints

### Get All Owners (Paged)
```
GET /api/owners?pageNumber=1&pageSize=20
```

### Create New Owner
```
POST /api/owners
```

## Maintenance Records Endpoints

### Get All Maintenance Records (Paged)
```
GET /api/maintenance-records?pageNumber=1&pageSize=20
```

### Create New Maintenance Record
```
POST /api/maintenance-records
```

## Service Types Endpoints

### Get All Service Types
```
GET /api/service-types
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error - Server error |

## Rate Limiting
- **Fixed Window**: 100 requests per minute for general endpoints
- **Authentication**: 5 requests per 5 minutes for auth endpoints
- **429 Too Many Requests** returned when limits exceeded

This API provides a complete solution for car maintenance management with modern features, proper validation, error handling, and real-time capabilities.