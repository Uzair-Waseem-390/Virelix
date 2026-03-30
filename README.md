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


┌─────────────────────────────────────────────────────────────────┐
│ Frontend (React + Vite) │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│ │ Admin │ │ Project │ │ Products │ │Inventory │ │ Sales ││
│ │Dashboard │ │Dashboard │ │ Page │ │ Page │ │ Page ││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Zustand Store (State Management) ││
│ └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────┬───────────────────────────────────┘
│ HTTP/REST API + JWT Auth
▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend (Django REST Framework) │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│ │ Accounts │ │ Projects │ │ Products │ │ Inventory │ │
│ │ API │ │ API │ │ API │ │ API │ │
│ └────────────┘ └────────────┘ └────────────┘ └──────────────┘ │
│ ┌────────────┐ ┌────────────────────────────────────────────┐ │
│ │ Sales │ │ AI Agent (OpenAI SDK) │ │
│ │ API │ │ └── Gemini Flash 2.5 LLM │ │
│ └────────────┘ └────────────────────────────────────────────┘ │
└─────────────┬───────────────────┬───────────────────────────────┘
│ │
▼ ▼
┌──────────────────┐ ┌──────────────────────────┐
│ PostgreSQL │ │ Redis + Celery │
│ Database │ │ (Background Tasks) │
│ │ │ - AI Analysis │
│ - Data Isolation │ │ - Low Stock Detection │
│ - Row-level │ │ - Automated Alerts │
│ Security │ │ │
└──────────────────┘ └──────────────────────────┘


## 🤖 AI Workflow Explanation

Virelix uses Google's Gemini AI (via OpenAI SDK agent with Gemini Flash 2.5 as LLM) to intelligently configure ERP modules based on your business description:

### Step-by-Step AI Analysis Process:
Step 1: User creates a project with business description
↓
Step 2: System dispatches Celery task for AI analysis
↓
Step 3: AI Agent (Gemini Flash 2.5) reads and analyzes business description
↓
Step 4: AI decides which modules are needed:
• Products Module? (if business sells/manages items)
• Inventory Module? (if stock tracking is required)
• Sales Module? (if transactions are processed)
↓
Step 5: System updates project with enabled modules
↓
Step 6: User sees configured modules in dashboard
↓
Step 7: User can now access enabled modules


### Example AI Decisions:

| Business Description | Products | Inventory | Sales |
|---------------------|----------|-----------|-------|
| "I run a retail clothing store that sells products and manages inventory" | ✅ | ✅ | ❌ |
| "We provide consulting services with invoicing" | ❌ | ❌ | ✅ |
| "E-commerce business selling electronics with stock tracking" | ✅ | ✅ | ✅ |
| "Restaurant with dine-in and takeaway orders" | ✅ | ✅ | ✅ |

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.14+ | Core programming language |
| Django | 6.0 | Web framework |
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

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python** 3.14 or higher
- **Node.js** 25+ and **npm** 11+
- **PostgreSQL** database server
- **Redis** server (for Celery background tasks)
- **Google Gemini API key** (get from [Google AI Studio](https://aistudio.google.com/))

## 🚀 Setup Instructions

### 1. Clone the Repository


git clone https://github.com/Uzair-Waseem-390/Virelix.git
cd Virelix
2. Backend Setup
Install UV Package Manager (Recommended)
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

Configure Environment Variables
Create a .env file in the backend directory with the following variables:
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

Initialize Database and Run Server
# Run database migrations
python manage.py makemigrations
python manage.py migrate

# (Optional) Create a superuser for Django admin
python manage.py createsuperuser

# Start Redis server (in a separate terminal)
redis-server

# Start Celery worker (in a separate terminal)
celery -A backend worker -l info

# Start Django development server
python manage.py runserver

Backend will run at: http://localhost:8000

3. Frontend Setup
bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create .env file for frontend
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
Frontend will run at: http://localhost:5173

4. Access the Application
Open http://localhost:5173 in your browser

Click "Get Started" or navigate to Register page

Create a new admin account

Enter your Gemini API key (get from Google AI Studio)

Login with your credentials

Create your first project with a business description

Let AI analyze and configure your ERP modules

Start using your personalized ERP system!

📚 API Documentation
Postman Collection
Access the complete API documentation via Postman:

🔗 Virelix API Collection

The collection includes all endpoints with example requests and responses.

Key API Endpoints
Authentication Endpoints
Method	Endpoint	Description	Auth Required
POST	/auth/login/	User login - returns JWT tokens	No
POST	/auth/refresh/	Refresh expired JWT token	No
POST	/accounts/register/	Register new admin user	No
User Management (Accounts)
Method	Endpoint	Description	Role
GET	/accounts/me/	Get own profile	All
GET	/accounts/me/profile/	Get full profile	Admin
PATCH	/accounts/me/profile/	Update profile	Admin
POST	/accounts/me/change-password/	Change password	All
DELETE	/accounts/me/delete/	Delete account	Admin
GET	/accounts/users/	List team members	Admin
Projects
Method	Endpoint	Description	Role
GET	/projects/	List user's projects	All
POST	/projects/	Create project (triggers AI)	Admin
GET	/projects/{id}/	Get project details	Member
PATCH	/projects/{id}/	Update project	Admin
DELETE	/projects/{id}/	Delete project	Admin
GET	/projects/{id}/ai-status/	Check AI analysis status	Admin
Products
Method	Endpoint	Description	Role
GET	/projects/{pid}/products/	List products	All
POST	/projects/{pid}/products/	Create product	All
GET	/projects/{pid}/products/{id}/	Get product details	All
PATCH	/projects/{pid}/products/{id}/	Update product	All
DELETE	/projects/{pid}/products/{id}/	Delete product	Admin/Manager
POST	/projects/{pid}/products/{id}/activate/	Activate product	Admin/Manager
POST	/projects/{pid}/products/{id}/deactivate/	Deactivate product	Admin/Manager
Inventory
Method	Endpoint	Description	Role
GET	/projects/{pid}/inventory/	List inventory	All
POST	/projects/{pid}/inventory/	Create inventory record	All
GET	/projects/{pid}/inventory/{id}/	Get inventory details	All
PATCH	/projects/{pid}/inventory/{id}/	Update threshold/location	All
DELETE	/projects/{pid}/inventory/{id}/	Delete record	Admin/Manager
POST	/projects/{pid}/inventory/{id}/stock-in/	Add stock	All
POST	/projects/{pid}/inventory/{id}/stock-out/	Remove stock	All
POST	/projects/{pid}/inventory/{id}/adjust/	Set exact quantity	Admin/Manager
GET	/projects/{pid}/inventory/{id}/movements/	Get movement history	All
Sales
Method	Endpoint	Description	Role
GET	/projects/{pid}/sales/	List sales	All
POST	/projects/{pid}/sales/	Create sale	All
GET	/projects/{pid}/sales/{id}/	Get sale details	All
PATCH	/projects/{pid}/sales/{id}/	Update sale (draft only)	All
DELETE	/projects/{pid}/sales/{id}/	Delete sale (draft)	Admin/Manager
POST	/projects/{pid}/sales/{id}/confirm/	Confirm sale	All
POST	/projects/{pid}/sales/{id}/cancel/	Cancel sale	Admin/Manager
POST	/projects/{pid}/sales/{id}/items/	Add item	All
PATCH	/projects/{pid}/sales/{id}/items/{iid}/	Update item	All
DELETE	/projects/{pid}/sales/{id}/items/{iid}/	Remove item	All

Response Formats
Success Response Example:

json
{
    "id": 1,
    "name": "Example Product",
    "price": "99.99",
    "created_at": "2024-01-01T00:00:00Z"
}
Error Response Example:

json
{
    "detail": "Error message describing what went wrong"
}
Pagination Response:

json
{
    "count": 100,
    "next": "http://api.example.com/products/?page=2",
    "previous": null,
    "results": [...]
}
🔄 Background Jobs (Celery)
Virelix uses Celery + Redis for asynchronous task processing:

Task	Trigger	Frequency	Description
AI Module Analysis	Project creation	On-demand	Analyzes business description to configure modules
Low Stock Detection	Scheduled	Every hour	Scans inventory for items below threshold
Out of Stock Detection	Scheduled	Every hour	Identifies items with zero quantity
Automated Email Alerts	On detection	Real-time	Sends notifications for low/out of stock
🎯 Module Access Matrix
Feature / Action	Admin	Manager	Staff
Products			
View products	✅	✅	✅
Search products	✅	✅	✅
Create product	✅	✅	✅
Update product	✅	✅	✅
Delete product	✅	✅	❌
Activate/Deactivate	✅	✅	❌
Inventory			
View inventory	✅	✅	✅
Search inventory	✅	✅	✅
Create inventory record	✅	✅	✅
Update threshold/location	✅	✅	✅
Stock In	✅	✅	✅
Stock Out	✅	✅	✅
Adjust quantity	✅	✅	❌
Delete inventory record	✅	✅	❌
View movement history	✅	✅	✅
Sales			
View sales	✅	✅	✅
Search sales	✅	✅	✅
Create sale	✅	✅	✅
Update sale (draft)	✅	✅	✅
Confirm sale	✅	✅	✅
Cancel sale	✅	✅	❌
Delete sale (draft)	✅	✅	❌
Team Management			
View team members	✅	❌	❌
Edit team members	✅	❌	❌
Activate/Deactivate members	✅	❌	❌
Project Management			
View projects	✅	✅	✅
Create project	✅	❌	❌
Update project	✅	❌	❌
Delete project	✅	❌	❌
Project settings	✅	❌	❌
🧪 Testing
Backend Testing
bash
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
Frontend Testing
bash
cd frontend

# Run linting
npm run lint

# Build for production (validates build)
npm run build

# Preview production build
npm run preview
📁 Project Structure
text
Virelix/
├── backend/                          # Django Backend
│   ├── accounts/                     # User authentication & management
│   │   ├── models.py                # User model with roles
│   │   ├── views.py                 # API endpoints
│   │   ├── services.py              # Business logic
│   │   ├── serializers.py           # Data validation
│   │   └── permissions.py           # Role-based permissions
│   ├── projects/                     # Project management & AI
│   │   ├── models.py                # Project model
│   │   ├── views.py                 # Project CRUD & AI trigger
│   │   └── services.py              # Project creation logic
│   ├── products/                     # Product management
│   │   ├── models.py                # Product model
│   │   ├── views.py                 # Product CRUD
│   │   └── services.py              # Product business logic
│   ├── inventory/                    # Stock management
│   │   ├── models.py                # Inventory & Movement models
│   │   ├── views.py                 # Stock operations
│   │   └── services.py              # Stock movement logic
│   ├── sales/                        # Sales transactions
│   │   ├── models.py                # Sale & SaleItem models
│   │   ├── views.py                 # Sales operations
│   │   └── services.py              # Sales & inventory sync
│   ├── ai_agent/                     # AI module configuration
│   │   ├── agent.py                 # OpenAI agent setup
│   │   ├── tasks.py                 # Celery tasks
│   │   └── prompts.py               # AI prompts
│   ├── virelix/                      # Django settings
│   │   ├── settings.py              # Project settings
│   │   ├── urls.py                  # Main URL configuration
│   │   └── celery.py                # Celery configuration
│   ├── manage.py                     # Django management script
│   └── requirements.txt              # Python dependencies
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── api/                      # API service layer
│   │   │   ├── axios.js             # Axios with interceptors
│   │   │   ├── accounts.js          # Auth API calls
│   │   │   ├── projects.js          # Projects API
│   │   │   ├── products.js          # Products API
│   │   │   ├── inventory.js         # Inventory API
│   │   │   ├── sales.js             # Sales API
│   │   │   └── dashboard.js         # Dashboard API
│   │   ├── components/               # Reusable components
│   │   │   ├── guards/              # Route guards
│   │   │   ├── layout/              # Layout components
│   │   │   ├── common/              # Shared components
│   │   │   ├── projects/            # Project components
│   │   │   ├── products/            # Product components
│   │   │   ├── inventory/           # Inventory components
│   │   │   └── sales/               # Sales components
│   │   ├── pages/                    # Page components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   ├── ProjectDashboardPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── ProductsPage.jsx
│   │   │   ├── InventoryPage.jsx
│   │   │   ├── MovementHistoryPage.jsx
│   │   │   ├── SalesPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── TeamPage.jsx
│   │   ├── store/                    # Zustand state management
│   │   │   └── authStore.js         # Auth & dashboard state
│   │   ├── hooks/                    # Custom React hooks
│   │   │   └── useDebounce.js       # Debounce hook
│   │   ├── utils/                    # Helper functions
│   │   │   └── form.js              # Form utilities
│   │   ├── App.jsx                   # Main app with routes
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # Global styles
│   ├── public/                       # Static assets
│   ├── index.html                    # HTML template
│   ├── package.json                  # NPM dependencies
│   ├── vite.config.js                # Vite configuration
│   └── postcss.config.js             # PostCSS config
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
🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

How to Contribute
Fork the repository

Create your feature branch

bash
git checkout -b feature/AmazingFeature
Commit your changes

bash
git commit -m 'Add some AmazingFeature'
Push to the branch

bash
git push origin feature/AmazingFeature
Open a Pull Request

Development Guidelines
Follow PEP 8 for Python code

Use ESLint for JavaScript/React code

Write meaningful commit messages

Update documentation when adding features

Add tests for new functionality

🐛 Known Issues
None currently. Please report issues on GitHub.

🗺️ Roadmap
Multi-language support

Export reports (PDF, Excel)

Advanced analytics dashboard

Mobile app (React Native)

Webhook integrations

Custom module builder

API rate limiting

Two-factor authentication

📞 Support
For support, please contact:

Email: uzairwaseem390@gmail.com

GitHub Issues: Create an issue

👨‍💻 Author
Uzair Waseem

Full Stack Developer

AI/ML Enthusiast

Connect with Me
LinkedIn: uzair-waseem-digital

GitHub: Uzair-Waseem-390

Portfolio: portfolio-five-opal-76.vercel.app

Email: uzairwaseem390@gmail.com

Phone: +92 3281525502

🙏 Acknowledgments
Google Gemini AI - Powering the intelligent module configuration

Django REST Framework - Excellent API framework

React & Tailwind CSS - Amazing frontend tools

Celery & Redis - Robust background task processing

PostgreSQL - Reliable database system

⭐ Show Your Support
If you found this project helpful or useful, please consider giving it a star ⭐ on GitHub!

https://img.shields.io/github/stars/Uzair-Waseem-390/Virelix
https://img.shields.io/github/forks/Uzair-Waseem-390/Virelix

Built with ❤️ by Uzair Waseem
