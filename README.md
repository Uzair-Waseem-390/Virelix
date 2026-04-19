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

### 💬 Per-Project AI ERP Agent *(New)*
- Every project has its own dedicated AI agent
- Ask any question about your ERP data and operations — the agent understands the full context of that specific project
- Agent responses are processed asynchronously via Celery + Redis for non-blocking performance
- Backend validates every query before dispatching to the background task queue
- Built on the OpenAI SDK with Gemini Flash 2.5 as the underlying LLM

### 🛠️ Developer Mode *(New)*
- A secure, password-protected mode that allows authorized developers to inject data directly into any ERP system
- Access is fully restricted — only users with the correct secure password can activate developer mode
- All data is validated by the backend before being pushed to background task processing
- Complete history of all developer-injected data is accessible through the job history panel, powered by Celery + Redis

### 📦 Complete ERP Modules
- **Products Management** — Full CRUD operations with SKU tracking, categories, and pricing
- **Inventory Management** — Stock tracking, low stock alerts, movement history, stock adjustments
- **Sales Management** — Create sales, confirm orders, automatic inventory deduction, sales history

### 👥 Role-Based Access Control
- **Admin** — Full system access, project management, team management, all settings
- **Manager** — Operational access, can create/update products, manage inventory, process sales
- **Staff** — Limited read access with basic operations (view products, process sales)

### 📊 Intelligent Dashboards
- **Admin Dashboard** — Cross-project analytics, alerts, and overview across all projects
- **Project Dashboard** — Project-specific metrics, module access, and real-time stats

### 🔐 Enterprise Security
- JWT-based authentication with automatic token refresh
- Project-level data isolation (no cross-project data access)
- Encrypted sensitive data (Gemini API keys using Fernet encryption)
- Role-based permissions for every action
- Developer mode secured behind an independent password layer

### ⚡ Real-time Features
- Live stock level updates
- Automatic inventory deduction on sales confirmation
- Background job processing with Celery + Redis
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
- **Page Components**: Admin Dashboard, Project Dashboard, Products, Inventory, Sales, and Agent Chat pages — each responsible for specific business functions
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
- **Module Configuration Agent**: Analyzes business descriptions asynchronously via Celery to configure ERP modules
- **Per-Project ERP Agent** *(New)*: A dedicated conversational agent scoped to each project — it understands the project's data and answers any ERP-related query from users. Queries are validated by the backend, dispatched to a Celery task, and responses are returned asynchronously

**7. Developer Mode (`data_entry` app)** *(New)*
- Password-protected access layer — activation requires a secure developer password independent of user roles
- Allows authorized developers to inject data into any ERP system (products, inventory, sales records, etc.)
- Backend validates all incoming developer data before queuing it as a background task via Celery + Redis
- Complete job history is stored and accessible via the developer history panel, showing every background task dispatched, its status, and its result

### Database Layer (PostgreSQL)

PostgreSQL serves as the primary database with several key design patterns:

- **Data Isolation**: Each project's data (products, inventory, sales) is isolated via foreign keys to the Project model
- **Soft Delete**: Products and inventory records use `is_active` flags instead of permanent deletion
- **Audit Trail**: Inventory movements, sales status changes, agent interactions, and developer job history are all recorded with timestamps and user information
- **Row-Level Security**: All queries are scoped to the authenticated user's project access

### Background Task Processing (Redis + Celery)

Celery with Redis as the message broker handles all asynchronous operations:

| Task | Trigger | Description |
|------|---------|-------------|
| AI Module Analysis | Project creation | Analyzes business description to configure modules |
| ERP Agent Response | User query submission | Runs the per-project AI agent and returns response |
| Developer Data Injection | Developer mode submission | Validates and injects developer-supplied data into the ERP |

### Request Flow: ERP Agent Query *(New)*

When a user asks the ERP agent a question:

1. **Frontend**: User types a question in the Agent Chat interface → submits query
2. **API Layer**: Axios sends the query with JWT token to the backend
3. **Backend Validation**: Django view validates the user's permissions and the query payload
4. **Task Dispatch**: A Celery task is created and pushed to the Redis queue
5. **Agent Execution**: The per-project AI agent (Gemini Flash 2.5 via OpenAI SDK) processes the query with full awareness of the project's ERP context
6. **Response Storage**: The agent's answer is stored and associated with the task
7. **Polling / Response**: Frontend polls or awaits the result and displays the agent's response to the user

### Request Flow: Developer Mode *(New)*

When an authorized developer injects data:

1. **Authentication**: Developer activates developer mode by providing the secure developer password
2. **Data Submission**: Developer submits data (e.g., bulk products, inventory records) through the developer interface
3. **Backend Validation**: Django validates the data schema and field constraints before any processing
4. **Task Dispatch**: Valid data is pushed to the Celery task queue via Redis
5. **Background Execution**: The task processes and writes data into the target ERP system
6. **History Recording**: The job is logged with its status (pending / success / failed) and the data payload
7. **History Access**: Developer can view the complete history of all previous injections from the history panel

### Request Flow: Standard Module Operation

When a user creates a new product:

1. **Frontend**: User fills product form → clicks submit → `ProductsPage` component calls `createProduct()` API function
2. **API Layer**: Axios interceptors add JWT token to request headers
3. **Backend**: Django view receives request → validates user has permission → calls service layer
4. **Service Layer**: Business logic validates data → creates product record in database
5. **Response**: Serialized product data returns to frontend → Zustand state updates → table refreshes

### Security Architecture

- **Authentication**: JWT tokens with access and refresh tokens (access token expires in 5 minutes, refresh token in 24 hours)
- **Authorization**: Role-based access control at both view and service layers
- **Developer Mode Security**: Protected by a separate, independently managed secure password — no regular user or admin credential grants access
- **Data Encryption**: Sensitive data (Gemini API keys) encrypted using Fernet symmetric encryption
- **CORS**: Configured to allow only trusted origins (localhost for development)
- **SQL Injection Protection**: Django ORM automatically parameterizes queries

---

## 🤖 AI Workflow Explanation

Virelix uses Google's Gemini AI (via OpenAI SDK with Gemini Flash 2.5 as LLM) for two distinct AI-powered workflows:

### Workflow 1: Module Configuration (on Project Creation)

| Step | Action |
|------|--------|
| **Step 1** | User creates a project with a business description |
| **Step 2** | System dispatches a Celery task for AI analysis |
| **Step 3** | AI Agent reads and analyzes the business description |
| **Step 4** | AI decides which modules are needed (Products, Inventory, Sales) |
| **Step 5** | System updates the project with enabled modules |
| **Step 6** | User sees configured modules in the dashboard |
| **Step 7** | User can now access and use the enabled modules |

### Workflow 2: Per-Project ERP Agent *(New)*

| Step | Action |
|------|--------|
| **Step 1** | User submits a question to the project's ERP agent |
| **Step 2** | Backend validates the request and user permissions |
| **Step 3** | Query is dispatched as a background Celery task |
| **Step 4** | Agent (Gemini Flash 2.5) processes the query within the project's ERP context |
| **Step 5** | Response is stored and returned to the frontend |
| **Step 6** | User sees the agent's answer in the chat interface |

### Example AI Module Decisions

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
| openai-agents | 0.13 | AI agent framework (module config + ERP agent) |

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

# Developer Mode
DEVELOPER_MODE_PASSWORD=your-secure-developer-password-here
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
9. *(Optional)* Use the **Agent Chat** within any project to ask ERP-related questions
10. *(Optional)* Activate **Developer Mode** with the secure developer password to manage data directly

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

#### ERP Agent *(New)*

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/projects/{pid}/agent/query/` | Submit query to project ERP agent | All |
| GET | `/projects/{pid}/agent/status/{task_id}/` | Poll agent task status | All |
| GET | `/projects/{pid}/agent/history/` | View agent query history | All |

#### Developer Mode *(New)*

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/developer/auth/` | Authenticate with developer password | Yes (JWT) |
| POST | `/developer/inject/` | Inject data into an ERP system | Yes (JWT + Dev Password) |
| GET | `/developer/history/` | View full developer job history | Yes (JWT + Dev Password) |
| GET | `/developer/history/{job_id}/` | Get details of a specific job | Yes (JWT + Dev Password) |

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

Virelix uses Celery + Redis for all asynchronous task processing:

| Task | Trigger | Description |
|------|---------|-------------|
| AI Module Analysis | Project creation | Analyzes business description to configure ERP modules |
| ERP Agent Query | User submits question | Runs the per-project AI agent and returns a response |
| Developer Data Injection | Developer mode submission | Validates and injects developer-supplied data into the ERP system |

All tasks are tracked and their statuses (pending / success / failed) are stored for auditability. Developer-injected job history is fully browsable from the developer panel.

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
| **ERP Agent** *(New)* | | | |
| Ask agent a question | ✅ | ✅ | ✅ |
| View agent query history | ✅ | ✅ | ✅ |
| **Developer Mode** *(New)* | | | |
| Activate developer mode | Requires Dev Password | Requires Dev Password | Requires Dev Password |
| Inject data into ERP | Requires Dev Password | Requires Dev Password | Requires Dev Password |
| View developer job history | Requires Dev Password | Requires Dev Password | Requires Dev Password |
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
python manage.py test ai_agent

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
│   ├── projects/                     # Project management & AI module config
│   ├── products/                     # Product management
│   ├── inventory/                    # Stock management
│   ├── sales/                        # Sales transactions
│   ├── ai_agent/                     # AI module configuration + per-project ERP agent
│   ├── developer/                    # Developer mode - secure data injection & job history
│   ├── virelix/                      # Django settings
│   └── manage.py                     # Django management script
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── api/                      # API service layer
│   │   ├── components/               # Reusable components
│   │   ├── pages/                    # Page components (incl. AgentChat, DeveloperMode)
│   │   ├── store/                    # Zustand state management
│   │   ├── hooks/                    # Custom React hooks
│   │   └── utils/                    # Helper functions
│   ├── public/                       # Static assets
│   └── package.json                  # NPM dependencies
│
├── images/                           # README screenshots
│   ├── landing_page.png
│   ├── admin_dashboard.png
│   ├── project_dashboard.png
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

- [**Google Gemini AI**](https://deepmind.google/technologies/gemini/) — Powering the intelligent module configuration and per-project ERP agents
- [**Django REST Framework**](https://www.django-rest-framework.org/) — Excellent API framework
- [**React & Tailwind CSS**](https://reactjs.org) — Amazing frontend tools
- [**Celery & Redis**](https://docs.celeryq.dev/) — Robust background task processing for agents, developer jobs, and async workflows
- [**PostgreSQL**](https://www.postgresql.org/) — Reliable database system

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
