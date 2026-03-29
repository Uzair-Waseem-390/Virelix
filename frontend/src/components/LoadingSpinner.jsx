// role: you're 15 years experience developer of frontend specifically react who create the premium and SaaS product level frontend with properly protects the routes and make the code reusable and scalable.
// goal: create the frontend for the requested routes. make sure that the frontend is premium level and SaaS product level it's not looks like simple. it's full of professional aminations and looks really cool.
// context: for project overview read the document and must create the landing page
// i've setup the frontend and installed the Tailwind CSS here are some files of code for you.
// frontend/vite.config.js:
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// export default defineConfig({
//   plugins: [
//     react(),
//     tailwindcss(),
//   ],
// })

// postcss.config.js:
// export default {
//     plugins: {
//         "@tailwindcss/postcss": {},
//         autoprefixer: {},
//     },
// }

// frontend/src/indes.css:
// @import "tailwindcss";
// frontend/src/App.css:
// empty
// frontend/src/App.jsx:
// import './App.css'
// function App() {
//   return (
//     <div className="h-screen flex items-center justify-center bg-gray-900">
//       <h1 className="text-4xl font-bold text-green-400">
//         Tailwind Working 🚀
//       </h1>
//     </div>
//   );
// }

// export default App;


// main.jsx:
// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )

// here are some backend related content for you:
// im using django rest framework
// path('auth/login/',   VorelixLoginView.as_view(),  name='token_obtain'),
//     path('auth/refresh/', TokenRefreshView.as_view(),     name='token_refresh'),
// """
// dashboard/auth.py
// ──────────────────
// Custom JWT login view that enriches the standard token response
// with role and redirect information.

// After login the frontend reads:
//   {
//       "access":        "...",
//       "refresh":       "...",
//       "role":          "admin" | "manager" | "staff",
//       "redirect_to":   "/dashboard/"              (admin)
//                     or "/dashboard/projects/<id>/" (manager/staff),
//       "project_id":    null | <int>               (null for admin)
//   }

// The frontend then navigates to redirect_to immediately.
// For admin:   calls GET /dashboard/ to load the main dashboard
// For others:  calls GET /dashboard/projects/<id>/ directly
// """

// from rest_framework_simplejwt.views import TokenObtainPairView
// from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
// from rest_framework.response import Response
// from rest_framework import status as http_status

// from accounts.models import Role


// class VorelixTokenSerializer(TokenObtainPairSerializer):
//     """Adds role + redirect_to to the default JWT response."""

//     def validate(self, attrs):
//         data = super().validate(attrs)

//         user = self.user

//         # Determine where this user should land after login
//         if user.role == Role.ADMIN:
//             redirect_to = "/dashboard/"
//             project_id  = None
//         else:
//             # Manager or Staff — find their project
//             from projects.selectors.project_selector import get_project_for_member
//             project = get_project_for_member(user)
//             if project:
//                 redirect_to = f"/dashboard/projects/{project.pk}/"
//                 project_id  = project.pk
//             else:
//                 redirect_to = "/dashboard/"
//                 project_id  = None

//         data["role"]        = user.role
//         data["redirect_to"] = redirect_to
//         data["project_id"]  = project_id

//         return data


// class VorelixLoginView(TokenObtainPairView):
//     """
//     POST /auth/login/
//     Drop-in replacement for TokenObtainPairView.
//     Returns access + refresh tokens plus role-aware redirect info.
//     """
//     serializer_class = VorelixTokenSerializer
// landing page: it's must looks like an premium level SaaS product landing page a lot of animation, create some 3 subscription plans but instead of purchase button write comming soon. and make these button disable.

// Project: Virelix — AI-powered ERP System
// Stack: React + Vite + Tailwind CSS + Axios + React Router v6 + Zustand (for auth state)
// Task: Build the complete Authentication section of the Virelix frontend.

// Backend context you must know before writing code:
// POST /auth/login/ — Login endpoint. Request body:
// json{ "email": "user@example.com", "password": "password123" }
// Response:
// json{
//     "access": "<jwt_access_token>",
//     "refresh": "<jwt_refresh_token>",
//     "role": "admin" | "manager" | "staff",
//     "redirect_to": "/dashboard/" | "/dashboard/projects/<id>/",
//     "project_id": null | 14
// }
// POST /auth/refresh/ — Refresh token endpoint. Request body:
// json{ "refresh": "<jwt_refresh_token>" }
// Response: { "access": "<new_access_token>" }
// POST /accounts/register/ — Register new admin user (public). Request body:
// json{
//     "email": "user@example.com",
//     "password": "password12345",
//     "gemini_api_key": "AIza..."
// }
// Response: user object with 201 status. Returns 400 with { "detail": "..." } on any error (invalid Gemini key, duplicate email, etc.)

// Pages to build:

// Login Page (/login)

// Email + password fields, both required
// On success: store access token, refresh token, role, project_id in Zustand store AND localStorage
// After storing: navigate to redirect_to from the response (do not hardcode the path — use whatever the backend returns)
// Show field-level error on wrong credentials (401)
// Show detail message from backend on any other error


// Register Page (/register)

// Fields: email, password, gemini_api_key — all required
// Show a helper text under gemini_api_key: "Your Gemini API key from Google AI Studio. It will be encrypted and stored securely."
// On success (201): auto-login the user (call login endpoint with same credentials) then redirect to dashboard
// Show detail error from backend inline (e.g. "The provided Gemini API key is invalid.")
// Link to Login page at bottom


// Route guards

// PrivateRoute component: if no access token in store → redirect to /login
// PublicRoute component: if already logged in → redirect to redirect_to stored in Zustand (so logged-in users can't see login/register again)
// Role-based guard: AdminRoute — only role=admin can access, others redirected to their redirect_to




// Axios setup:
// Create src/api/axios.js:

// Base URL: http://127.0.0.1:8000
// Request interceptor: attach Authorization: Bearer <access_token> from Zustand store to every request
// Response interceptor: on 401 → call POST /auth/refresh/ with stored refresh token → if success update access token in store and retry original request → if refresh fails clear store and redirect to /login


// Zustand store (src/store/authStore.js):
// js{
//     user: null,         // { email, role, project_id, redirect_to }
//     accessToken: null,
//     refreshToken: null,
//     isAuthenticated: false,
//     login(data),        // sets all fields
//     logout(),           // clears all fields, calls navigate('/login')
// }
// ```
// Persist to localStorage so page refresh keeps the user logged in.

// ---

// **Design requirements:**
// - Clean, modern, professional UI — dark navy sidebar palette with white content area (inspired by enterprise ERP tools like SAP or Odoo)
// - Responsive — works on desktop and tablet
// - Loading spinner on all async actions
// - Disable submit button while request is in flight to prevent double-submit
// - No dummy/hardcoded credentials anywhere

// ---

// **File structure expected:**
// ```
// src/
// ├── api/
// │   └── axios.js
// ├── store/
// │   └── authStore.js
// ├── pages/
// │   ├── LoginPage.jsx
// │   └── RegisterPage.jsx
// ├── components/
// │   └── guards/
// │       ├── PrivateRoute.jsx
// │       ├── PublicRoute.jsx
// │       └── AdminRoute.jsx
// └── App.jsx              ← define all routes here using React Router v6
// Constraints:

// Use axios not fetch
// Use Zustand with persist middleware (zustand/middleware)
// Use React Router v6 (useNavigate, <Navigate>, <Outlet>)
// No UI component library (no MUI, no Chakra) — pure Tailwind only
// All API error messages must come from backend { "detail": "..." } — never show generic "something went wrong"
// Token refresh must be transparent to the user (silent retry)










const LoadingSpinner = () => {
    return (
        <div className="flex items-center justify-center">
            <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
                <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
        </div>
    );
};

export default LoadingSpinner;