# Diet Leaves - E-Commerce Platform

A stevia-based products e-commerce and branding website with a fully customizable admin panel.

## Tech Stack

- **Frontend**: TypeScript, Next.js 14, React, Tailwind CSS
- **Backend**: Python, FastAPI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Project Structure

```
diet_leaves/
├── api/                    # Python FastAPI Backend
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── models/         # Pydantic models
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, CORS, etc.
│   │   └── utils/          # Helper functions
│   ├── sql/                # Database scripts
│   └── tests/              # Backend tests
├── ui/                     # Next.js Frontend
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities & API client
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
└── .env                    # Environment variables
```

## Features

### Customer Features
- Browse products with categories
- Product details with nutritional info
- Shopping cart
- Checkout with Cash on Delivery
- Order tracking
- Customer reviews

### Admin Panel Features
- Full website customization (hero, banners, footer)
- Product management (CRUD)
- Order management & tracking
- Inventory management
- Site settings

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account

### Backend Setup
```bash
cd api
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn src.main:app --reload
```

### Frontend Setup
```bash
cd ui
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials.

## License

Private - Diet Leaves
