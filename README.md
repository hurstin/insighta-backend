# Queryable Intelligence Engine (Insighta Labs)

This is a production-ready **Queryable Intelligence Engine** built with **NestJS**, **TypeORM**, and **PostgreSQL**. The engine processes and serves demographic profile data, allowing clients (marketing teams, product teams, growth analysts) to segment users, identify patterns, and query large datasets efficiently.

## Features

- **Advanced Filtering**: Filter by `gender`, `age_group`, `country_id`, `min_age`, `max_age`, `min_gender_probability`, and `min_country_probability`.
- **Sorting & Pagination**: Full pagination support (`page`, `limit`) and custom sorting (`sort_by`, `order`).
- **Natural Language Query (Core Feature)**: A rule-based natural language parser that translates plain English queries (e.g., *"young males from nigeria"*) into complex filtering criteria dynamically.
- **Automated Database Seeding**: Automatic parsing and bulk-insertion of demographic JSON data on startup using a custom `ProfilesSeeder`.
- **Custom Validation**: Strict input validation using `class-validator` and custom exception filters to enforce consistent API error formatting (`{"status": "error", "message": "..."}`).
- **UUIDv7**: Modern, time-ordered UUIDv7 identifiers for optimal database indexing and sorting.

---

## Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** database (Local or Cloud-hosted like Aiven/Neon)
- **npm** or **yarn**

---

## Setup & Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory and add your PostgreSQL credentials:
   ```env
   DB_HOST=your-database-host
   DB_PORT=5432
   DB_USER=your-database-username
   DB_PASSWORD=your-database-password
   DB_NAME=insighta
   ```

3. **Data Seeding**
   Ensure `profiles_seed.json` is located at the root of the project. The `ProfilesSeeder` will automatically read this file and bulk-insert the 2026 profiles when the server starts (if the database is empty).

4. **Start the Server**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

---

## API Endpoints

### 1. Advanced Filtering
**Endpoint:** `GET /api/profiles`

**Query Parameters:**
| Parameter | Type | Example |
|---|---|---|
| `gender` | String | `male`, `female` |
| `age_group` | String | `child`, `teenager`, `adult`, `senior` |
| `country_id` | String | `NG`, `US`, `GB` |
| `min_age` | Integer | `25` |
| `max_age` | Integer | `40` |
| `sort_by` | String | `age`, `created_at`, `gender_probability` |
| `order` | String | `asc`, `desc` |
| `page` | Integer | `1` (Default: 1) |
| `limit` | Integer | `10` (Max: 50) |

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&limit=5"
```

### 2. Natural Language Query
**Endpoint:** `GET /api/profiles/search`

**Query Parameters:**
| Parameter | Type | Description |
|---|---|---|
| `q` | String (Required) | Your natural language query |
| `page` | Integer | Pagination page |
| `limit` | Integer | Pagination limit |

**Example Queries:**
- `"young males"` 
- `"females above 30"`
- `"people from angola"`
- `"adult males from kenya"`
- `"male and female teenagers above 17"`

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/profiles/search?q=young%20males%20from%20nigeria"
```

---

## Standardized Responses

**Success:**
```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 45,
  "data": [
    {
      "id": "018e...",
      "name": "Bayo Ouédraogo",
      "gender": "male",
      "age": 27,
      "country_id": "NG"
    }
  ]
}
```

**Validation Error:**
```json
{
  "status": "error",
  "message": "Invalid query parameters"
}
```

## Technologies Used
- [NestJS](https://nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Class Validator](https://github.com/typestack/class-validator)
- [UUID](https://github.com/uuidjs/uuid)

## License
UNLICENSED
