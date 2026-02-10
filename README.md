# FoodReady — Backend

Backend API for the **FoodReady** platform, built with **NestJS** and **Prisma**.  
The application provides authentication, order management, and a public order-tracking flow designed to support both internal users and end customers.

## Overview

The backend is responsible for:
- managing companies, employees, and orders
- handling authentication and authorization
- exposing a public order-tracking endpoint
- supporting real-time or near real-time order status updates

The application is structured in a modular, domain-oriented way and follows production-ready NestJS patterns.

## Key Features

- **JWT-based authentication**
- **Role-based access** for internal users (owners, employees)
- **Public order tracking module** (no authentication required)
- **Order lifecycle management**
- **Centralized configuration validation** using Joi
- **Global request validation** with `ValidationPipe`
- **CORS allowlist** driven by environment configuration
- **Cookie-based authentication support**

## Tech Stack

- NestJS
- Prisma ORM
- PostgreSQL (via `DATABASE_URL`)
- Passport JWT
- Joi (environment validation)
- class-validator / class-transformer
- cookie-parser

## Architecture Highlights

- Feature-based module structure:
    - `authentication`
    - `companies`
    - `employees`
    - `orders`
    - `order-tracking`
- Dedicated `database` module encapsulating Prisma
- Clear separation between internal (authenticated) and public APIs
- Environment configuration validated at application startup

## Development

Install dependencies:
```bash
npm install
```
Generate Prisma client:
```bash
npm run prisma:generate
```
Run database migrations:
```bash
npm run prisma:migrate
```
Start the application in development mode:
```bash
npm run start:dev
```

The API runs on port 3000 by default.

## Environment Variables

Create a `.env` file based on `.env.example`.

Required variables:

- DATABASE_URL
- FRONTEND_URL (comma-separated list of allowed origins)
- JWT_SECRET
- JWT_EXPIRATION_TIME (number, e.g. 3600)
