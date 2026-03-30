# 🚀 Virelix - AI-Powered ERP System

[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](https://python.org)
[![Django](https://img.shields.io/badge/Django-6.0-green.svg)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7.4-DC382D.svg)](https://redis.io)

Virelix is an intelligent, AI-powered Enterprise Resource Planning (ERP) system that automatically configures itself based on your business description. Say goodbye to manual module configuration - let AI understand your business needs and set up the perfect ERP system for you.

![Landing Page](images/landing_page.png)

---

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

---

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

---

## 🏗️ Architecture Overview

Virelix follows a modern, scalable client-server architecture with clear separation of concerns:

### Frontend Layer (React + Vite)

The frontend is built as a Single Page Application (SPA) using React 19 and Vite for fast development and optimal performance.

**Key Components:**
- **Page Components**: Admin Dashboard, Project Dashboard, Products, Inventory, and Sales pages - each responsible for specific business functions
- **Reusable Components**: Modal dialogs, tables, forms, and UI elements shared across multiple pages
- **State Management**: Zustand handles global state including authentication tokens, user data, and dashboard information
- **API Service Layer**: Axios instances with interceptors manage all backend communication, including automatic JWT token refresh

**How it works:**
When a user interacts with the interface (e.g., clicks "Add Product"), the React component triggers an API call through the service layer. The request includes the JWT token automatically attached by Axios interceptors. The response updates the local state, which triggers a re-render of the affected components.

### Backend Layer (Django REST Framework)

The backend is organized into modular apps, each handling specific business domains:

**1. Authentication & Accounts (`accounts` app)**
- Manages user registration, login, and JWT token issuance
- Handles role-based access control (Admin, Manager, Staff)
- Provides profile management and team administration endpoints
- Encrypts sensitive data like Gemini API keys using Fernet encryption

**2. Project Management (`projects` app)**
- Handles project CRUD operations
- Triggers AI analysis when projects are created or descriptions change
- Manages project-specific data isolation (each project's data is completely separate)

**3. Products Module (`products` app)**
- Manages product catalog with SKU tracking
- Supports soft-delete (activate/deactivate) and hard-delete operations
- Validates input data and enforces business rules

**4. Inventory Module (`inventory` app)**
- Tracks stock levels with real-time updates
- Records all stock movements (stock in, stock out, adjustments)
- Provides low stock and out-of-stock alerts
- Maintains complete movement history for audit trails

**5. Sales Module (`sales` app)**
- Processes sales transactions with draft/confirmed/cancelled states
- Automatically deducts inventory when sales are confirmed
- Restores inventory when confirmed sales are cancelled
- Supports line-item management for draft sales

**6. AI Agent (`ai_agent` app)**
- Uses OpenAI SDK with Gemini Flash 2.5 as the LLM
- Analyzes business descriptions asynchronously via Celery
- Returns structured module configuration (products, inventory, sales)
- Updates project settings automatically after analysis

### Database Layer (PostgreSQL)

PostgreSQL serves as the primary database with several key design patterns:

- **Data Isolation**: Each project's data (products, inventory, sales) is isolated via foreign keys to the Project model
- **Soft Delete**: Products and inventory records use `is_active` flags instead of permanent deletion
- **Audit Trail**: Inventory movements and sales status changes are recorded with timestamps and user information
- **Row-Level Security**: All queries are scoped to the authenticated user's project access

### Background Task Processing (Redis + Celery)

Celery with Redis as the message broker handles asynchronous operations:

- **AI Module Analysis**: When a project is created, a Celery task runs the AI analysis without blocking the user
- **Low Stock Detection**: Scheduled tasks scan inventory and generate alerts for items below threshold
- **Automated Notifications**: Email alerts are sent asynchronously when stock levels are critical

### Request Flow Example

When a user creates a new product:

1. **Frontend**: User fills product form → clicks submit → `ProductsPage` component calls `createProduct()` API function
2. **API Layer**: Axios interceptors add JWT token to request headers
3. **Backend**: Django view receives request → validates user has permission → calls service layer
4. **Service Layer**: Business logic validates data → creates product record in database
5. **Response**: Serialized product data returns to frontend → Zustand state updates → table refreshes

### AI Analysis Flow

When an admin creates a new project:

1. **Project Creation**: Frontend sends project name and business description to backend
2. **Immediate Response**: Backend returns `202 Accepted` with project ID and task ID
3. **Background Processing**: Celery task starts with the business description
4. **AI Analysis**: Gemini Flash 2.5 analyzes the description and determines required modules
5. **Database Update**: Project is updated with enabled modules (products, inventory, sales)
6. **Polling**: Frontend polls `/ai-status/` endpoint every 3 seconds until analysis completes
7. **User Notification**: User sees the configured modules in their project dashboard

### Security Architecture

- **Authentication**: JWT tokens with access and refresh tokens (access token expires in 5 minutes, refresh token in 24 hours)
- **Authorization**: Role-based access control at both view and service layers
- **Data Encryption**: Sensitive data (Gemini API keys) encrypted using Fernet symmetric encryption
- **CORS**: Configured to allow only trusted origins (localhost for development)
- **SQL Injection Protection**: Django ORM automatically parameterizes queries

---

## 🤖 AI Workflow Explanation

Virelix uses Google's Gemini AI (via OpenAI SDK agent with Gemini Flash 2.5 as LLM) to intelligently configure ERP modules based on your business description:

### Step-by-Step AI Analysis Process:

| Step | Action |
|------|--------|
| **Step 1** | User creates a project with business description |
| **Step 2** | System dispatches Celery task for AI analysis |
| **Step 3** | AI Agent (Gemini Flash 2.5) reads and analyzes business description |
| **Step 4** | AI decides which modules are needed |
| **Step 5** | System updates project with enabled modules |
| **Step 6** | User sees configured modules in dashboard |
| **Step 7** | User can now access enabled modules |

### Example AI Decisions:

| Business Description | Products | Inventory | Sales |
|---------------------|----------|-----------|-------|
| "I run a retail clothing store that sells products and manages inventory" | ✅ | ✅ | ❌ |
| "We provide consulting services with invoicing" | ❌ | ❌ | ✅ |
| "E-commerce business selling electronics with stock tracking" | ✅ | ✅ | ✅ |
| "Restaurant with dine-in and takeaway orders" | ✅ | ✅ | ✅ |

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.14+ | Core programming language |
| Django REST Framework | 3.17 | REST API development |
| Celery | 5.6 | Background task processing |
| Redis | 7.4 | Message broker & caching |
| PostgreSQL | Latest | Production database |
| django-cors-headers | 4.9 | CORS handling |
| djangorestframework-simplejwt | 5.5 | JWT authentication |
| cryptography | 46.0 | Data encryption |
| google-generativeai | 0.8 | Gemini AI integration |
| openai-agents | 0.13 | AI agent framework |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| Vite | 8 | Build tool & dev server |
| Tailwind CSS | 4 | Utility-first styling |
| Zustand | 5 | State management |
| Axios | 1.14 | HTTP client |
| React Router DOM | 7 | Client-side routing |
| date-fns | 4 | Date formatting |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python** 3.14 or higher
- **Node.js** 25+ and **npm** 11+
- **PostgreSQL** database server
- **Redis** server (for Celery background tasks)
- **Google Gemini API key** (get from [Google AI Studio](https://aistudio.google.com/))

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Uzair-Waseem-390/Virelix.git
cd Virelix
```

### 2. Backend Setup

#### Install UV Package Manager (Recommended)

```bash
# Install UV if not already installed
pip install uv

# Navigate to backend directory
cd backend

# Create virtual environment
uv venv

# Activate virtual environment
# On Linux/Mac:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
uv pip install -e .
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-super-secret-key-here

# Database Configuration (PostgreSQL)
ENGINE=django.db.backends.postgresql
NAME=virelix_db
USER=your_database_user
PASSWORD=your_database_password
HOST=localhost
PORT=5432

# Gemini AI Configuration
GEMINI_BASE_URL=https://generativelanguage.googleapis.com
FERNET_KEY=your-fernet-key-here
```

#### Initialize Database and Run Server

```bash
# Run database migrations
python manage.py makemigrations
python manage.py migrate

# (Optional) Create a superuser for Django admin
python manage.py createsuperuser

# Start Redis server (in a separate terminal)
redis-server

# Start Celery worker (in a separate terminal)
celery -A virelix worker --loglevel=info

# Start Django development server
python manage.py runserver
```

> Backend will run at: **http://localhost:8000**

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create .env file for frontend
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

> Frontend will run at: **http://localhost:5173**

### 4. Access the Application

1. Open **http://localhost:5173** in your browser
2. Click **"Get Started"** or navigate to the Register page
3. Create a new admin account
4. Enter your Gemini API key (get from [Google AI Studio](https://aistudio.google.com/))
5. Login with your credentials
6. Create your first project with a business description
7. Let AI analyze and configure your ERP modules
8. Start using your personalized ERP system!

---

## 📚 API Documentation

### Postman Collection

Access the complete API documentation via Postman:

🔗 **[Virelix API Collection](https://www.postman.com)**

The collection includes all endpoints with example requests and responses.

### Key API Endpoints

#### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/auth/login/` | User login - returns JWT tokens | No |
| POST | `/auth/refresh/` | Refresh expired JWT token | No |
| POST | `/accounts/register/` | Register new admin user | No |

#### User Management (Accounts)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/accounts/me/` | Get own profile | All |
| GET | `/accounts/me/profile/` | Get full profile | Admin |
| PATCH | `/accounts/me/profile/` | Update profile | Admin |
| POST | `/accounts/me/change-password/` | Change password | All |
| DELETE | `/accounts/me/delete/` | Delete account | Admin |
| GET | `/accounts/users/` | List team members | Admin |

#### Projects

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/projects/` | List user's projects | All |
| POST | `/projects/` | Create project (triggers AI) | Admin |
| GET | `/projects/{id}/` | Get project details | Member |
| PATCH | `/projects/{id}/` | Update project | Admin |
| DELETE | `/projects/{id}/` | Delete project | Admin |
| GET | `/projects/{id}/ai-status/` | Check AI analysis status | Admin |

#### Products

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/projects/{pid}/products/` | List products | All |
| POST | `/projects/{pid}/products/` | Create product | All |
| GET | `/projects/{pid}/products/{id}/` | Get product details | All |
| PATCH | `/projects/{pid}/products/{id}/` | Update product | All |
| DELETE | `/projects/{pid}/products/{id}/` | Delete product | Admin/Manager |
| POST | `/projects/{pid}/products/{id}/activate/` | Activate product | Admin/Manager |
| POST | `/projects/{pid}/products/{id}/deactivate/` | Deactivate product | Admin/Manager |

#### Inventory

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/projects/{pid}/inventory/` | List inventory | All |
| POST | `/projects/{pid}/inventory/` | Create inventory record | All |
| GET | `/projects/{pid}/inventory/{id}/` | Get inventory details | All |
| PATCH | `/projects/{pid}/inventory/{id}/` | Update threshold/location | All |
| DELETE | `/projects/{pid}/inventory/{id}/` | Delete record | Admin/Manager |
| POST | `/projects/{pid}/inventory/{id}/stock-in/` | Add stock | All |
| POST | `/projects/{pid}/inventory/{id}/stock-out/` | Remove stock | All |
| POST | `/projects/{pid}/inventory/{id}/adjust/` | Set exact quantity | Admin/Manager |
| GET | `/projects/{pid}/inventory/{id}/movements/` | Get movement history | All |

#### Sales

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/projects/{pid}/sales/` | List sales | All |
| POST | `/projects/{pid}/sales/` | Create sale | All |
| GET | `/projects/{pid}/sales/{id}/` | Get sale details | All |
| PATCH | `/projects/{pid}/sales/{id}/` | Update sale (draft only) | All |
| DELETE | `/projects/{pid}/sales/{id}/` | Delete sale (draft) | Admin/Manager |
| POST | `/projects/{pid}/sales/{id}/confirm/` | Confirm sale | All |
| POST | `/projects/{pid}/sales/{id}/cancel/` | Cancel sale | Admin/Manager |
| POST | `/projects/{pid}/sales/{id}/items/` | Add item | All |
| PATCH | `/projects/{pid}/sales/{id}/items/{iid}/` | Update item | All |
| DELETE | `/projects/{pid}/sales/{id}/items/{iid}/` | Remove item | All |

### Response Formats

**Success Response Example:**
```json
{
    "id": 1,
    "name": "Example Product",
    "price": "99.99",
    "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Response Example:**
```json
{
    "detail": "Error message describing what went wrong"
}
```

---

## 🔄 Background Jobs (Celery)

Virelix uses Celery + Redis for asynchronous task processing:

| Task | Trigger | Frequency | Description |
|------|---------|-----------|-------------|
| AI Module Analysis | Project creation | On-demand | Analyzes business description to configure modules |
| Low Stock Detection | Scheduled | Every hour | Scans inventory for items below threshold |
| Out of Stock Detection | Scheduled | Every hour | Identifies items with zero quantity |
| Automated Email Alerts | On detection | Real-time | Sends notifications for low/out of stock |

---

## 🎯 Module Access Matrix

| Feature / Action | Admin | Manager | Staff |
|-----------------|-------|---------|-------|
| **Products** | | | |
| View products | ✅ | ✅ | ✅ |
| Search products | ✅ | ✅ | ✅ |
| Create product | ✅ | ✅ | ✅ |
| Update product | ✅ | ✅ | ✅ |
| Delete product | ✅ | ✅ | ❌ |
| Activate/Deactivate | ✅ | ✅ | ❌ |
| **Inventory** | | | |
| View inventory | ✅ | ✅ | ✅ |
| Search inventory | ✅ | ✅ | ✅ |
| Create inventory record | ✅ | ✅ | ✅ |
| Update threshold/location | ✅ | ✅ | ✅ |
| Stock In | ✅ | ✅ | ✅ |
| Stock Out | ✅ | ✅ | ✅ |
| Adjust quantity | ✅ | ✅ | ❌ |
| Delete inventory record | ✅ | ✅ | ❌ |
| View movement history | ✅ | ✅ | ✅ |
| **Sales** | | | |
| View sales | ✅ | ✅ | ✅ |
| Search sales | ✅ | ✅ | ✅ |
| Create sale | ✅ | ✅ | ✅ |
| Update sale (draft) | ✅ | ✅ | ✅ |
| Confirm sale | ✅ | ✅ | ✅ |
| Cancel sale | ✅ | ✅ | ❌ |
| Delete sale (draft) | ✅ | ✅ | ❌ |
| **Team Management** | | | |
| View team members | ✅ | ❌ | ❌ |
| Edit team members | ✅ | ❌ | ❌ |
| Activate/Deactivate members | ✅ | ❌ | ❌ |
| **Project Management** | | | |
| View projects | ✅ | ✅ | ✅ |
| Create project | ✅ | ❌ | ❌ |
| Update project | ✅ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ |
| Project settings | ✅ | ❌ | ❌ |

---

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts
python manage.py test products
python manage.py test inventory
python manage.py test sales

# Run with verbosity
python manage.py test --verbosity=2
```

### Frontend Testing

```bash
cd frontend

# Run linting
npm run lint

# Build for production (validates build)
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
Virelix/
├── backend/                          # Django Backend
│   ├── accounts/                     # User authentication & management
│   ├── projects/                     # Project management & AI
│   ├── products/                     # Product management
│   ├── inventory/                    # Stock management
│   ├── sales/                        # Sales transactions
│   ├── ai_agent/                     # AI module configuration
│   ├── virelix/                      # Django settings
│   └── manage.py                     # Django management script
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── api/                      # API service layer
│   │   ├── components/               # Reusable components
│   │   ├── pages/                    # Page components
│   │   ├── store/                    # Zustand state management
│   │   ├── hooks/                    # Custom React hooks
│   │   └── utils/                    # Helper functions
│   ├── public/                       # Static assets
│   └── package.json                  # NPM dependencies
│
├── images/                           # README screenshots
│   ├── landing_page.png
│   ├── admin_dashboard.png
│   ├── projectdashboard.png
│   ├── products.png
│   ├── inventory.png
│   └── sales.png
│
├── .gitignore                        # Git ignore rules
├── pyproject.toml                    # Python project configuration
└── README.md                         # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### How to Contribute

1. **Fork** the repository
2. **Create** your feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit** your changes
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open** a Pull Request

### Development Guidelines

- Follow **PEP 8** for Python code
- Use **ESLint** for JavaScript/React code
- Write meaningful commit messages
- Update documentation when adding features
- Add tests for new functionality

---

## 📞 Support

For support, please contact:

- 📧 **Email**: uzairwaseem390@gmail.com
- 🐛 **GitHub Issues**: [Create an issue](https://github.com/Uzair-Waseem-390/Virelix/issues)

---

## 👨‍💻 Author

**Uzair Waseem**
- Full Stack Developer
- AI/ML Enthusiast

### Connect with Me

| Platform | Link |
|----------|------|
| 💼 LinkedIn | [uzair-waseem-digital](https://linkedin.com/in/uzair-waseem-digital) |
| 🐙 GitHub | [Uzair-Waseem-390](https://github.com/Uzair-Waseem-390) |
| 🌐 Portfolio | [portfolio-five-opal-76.vercel.app](https://portfolio-five-opal-76.vercel.app) |
| 📧 Email | uzairwaseem390@gmail.com |
| 📱 Phone | +92 3281525502 |

---

## 🙏 Acknowledgments

- [**Google Gemini AI**](https://deepmind.google/technologies/gemini/) - Powering the intelligent module configuration
- [**Django REST Framework**](https://www.django-rest-framework.org/) - Excellent API framework
- [**React & Tailwind CSS**](https://reactjs.org) - Amazing frontend tools
- [**Celery & Redis**](https://docs.celeryq.dev/) - Robust background task processing
- [**PostgreSQL**](https://www.postgresql.org/) - Reliable database system


---

## ⭐ Show Your Support

If you found this project helpful or useful, please consider giving it a star ⭐ on GitHub!

[![GitHub stars](https://img.shields.io/github/stars/Uzair-Waseem-390/Virelix)](https://github.com/Uzair-Waseem-390/Virelix/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Uzair-Waseem-390/Virelix)](https://github.com/Uzair-Waseem-390/Virelix/network/members)

---

<div align="center">

Built with ❤️ by **Uzair Waseem**

*Empowering businesses with AI-driven ERP solutions*

</div>
