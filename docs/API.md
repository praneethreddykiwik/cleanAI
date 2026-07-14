# 📡 REST API Reference

The Clean AI platform API version `v1` is exposed at `/api/v1/*`. All responses return a standardized wrapper format:

```json
{
  "success": true,
  "message": "Optional message string",
  "data": { ... },
  "error": "Optional error string if success is false"
}
```

---

## 🔒 Authentication Endpoints

### `POST /api/v1/auth/register`
Creates a new user profile. Dispatches verify OTP workflow.
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "SecurePassword123",
    "role": "CUSTOMER"
  }
  ```

### `POST /api/v1/auth/login`
Validates credentials, returns JWT access and refresh tokens.
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePassword123"
  }
  ```

---

## 👥 Customer Profile Endpoints

### `GET /api/v1/users/me`
Retrieves currently logged in user metadata. Requires Bearer Auth.

### `GET /api/v1/users/me/addresses`
Retrieves list of saved service delivery locations.

---

## 🏪 Vendor Business Endpoints

### `GET /api/v1/vendors/profile`
Retrieves vendor details, onboarding check progress, and verified badges.

### `PUT /api/v1/vendors/pricing`
Updates pricing guidelines catalog options.

---

## 🗓️ Bookings Management

### `POST /api/v1/bookings`
Creates a manual booking request.
- **Request Body**:
  ```json
  {
    "serviceId": "cleaning-uuid",
    "addressId": "addr-uuid",
    "scheduledDate": "2026-07-15",
    "scheduledTime": "10:00 AM - 12:00 PM"
  }
  ```

### `POST /api/v1/bookings/:id/assign`
Assigns a verified agent to the booking. Requires role VENDOR.
