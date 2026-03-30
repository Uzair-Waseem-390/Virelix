# 🚀 Virelix - AI-Powered ERP System

[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](https://python.org)
[![Django](https://img.shields.io/badge/Django-6.0-green.svg)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7.4-DC382D.svg)](https://redis.io)

Virelix is an intelligent, AI-powered Enterprise Resource Planning (ERP) system that automatically configures itself based on your business description. Say goodbye to manual module configuration - let AI understand your business needs and set up the perfect ERP system for you.

![Landing Page](images/landing_page.png)

## ✨ Features

### 🤖 AI-Powered Module Configuration
- Describe your business in plain English
- AI automatically determines which modules you need (Products, Inventory, Sales)
- No manual configuration required

### 📦 Complete ERP Modules
- **Products Management** - Full CRUD operations with SKU tracking, categories, and pricing
- **Inventory Management** - Stock tracking, low stock alerts, movement history, stock adjustments
- **Sales Management** - Create sales, confirm orders, automatic inventory deduction, sales history

### 👥 Role-Based Access Control
- **Admin** - Full system access, project management, team management, all settings
- **Manager** - Operational access, can create/update products, manage inventory, process sales
- **Staff** - Limited read access with basic operations (view products, process sales)

### 📊 Intelligent Dashboards
- **Admin Dashboard** - Cross-project analytics, alerts, and overview across all projects
- **Project Dashboard** - Project-specific metrics, module access, and real-time stats

### 🔐 Enterprise Security
- JWT-based authentication with automatic token refresh
- Project-level data isolation (no cross-project data access)
- Encrypted sensitive data (Gemini API keys using Fernet encryption)
- Role-based permissions for every action

### ⚡ Real-time Features
- Live stock level updates
- Automatic inventory deduction on sales confirmation
- Background job processing with Celery
- Real-time low stock alerts

## 📸 Screenshots

### Landing Page
![Landing Page](images/landing_page.png)

### Admin Dashboard
![Admin Dashboard](images/admin_dashboard.png)

### Project Dashboard
![Project Dashboard](images/project_dashboard.png)

### Products Management
![Products Module](images/products.png)

### Inventory Management
![Inventory Module](images/inventory.png)

### Sales Management
![Sales Module](images/sales.png)

## 🏗️ Architecture Overview
