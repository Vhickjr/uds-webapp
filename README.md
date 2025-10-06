# Unilag Design Studio — Inventory Management Web App

A full-stack inventory management system designed to streamline asset tracking, improve transparency, and enhance operational efficiency within the Unilag Design Studio. This application helps manage tools, materials, and equipment usage in real time, ensuring accountability and better resource planning for ongoing projects.

---

## Overview

Managing inventory in a dynamic design and engineering space like the Unilag Design Studio requires precision, clarity, and efficiency. This web app provides a centralized platform for:

- Tracking all tools, equipment, and consumables
- Monitoring item availability and usage history
- Managing check-in/check-out activities
- Assigning inventory to staff or student projects
- Maintaining a clear record of stock levels

Built to support a growing innovation hub, this system ensures that resources are always well-accounted for and easily accessible.

---

## Features

**Dashboard Overview** — Quick glance at inventory levels and recent activity

**Search & Filter** — Find items by name, category, or availability

**Item Management** — Add, edit, or remove inventory items with ease

**Check-In / Check-Out** — Track item usage and assignments

**User Roles** — Separate views for admin and standard users

**Usage Insights** — Monitor item demand and usage frequency

**Authentication** — Secure access for registered users

---

## Tech Stack

**Frontend:** React.js

**Backend:** Flask (Python)

**Database:** SQLite / PostgreSQL

**Styling:** Tailwind CSS

**API:** RESTful Architecture

---

## Project Structure

```
unilag-inventory/
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── routes/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- pip

### Installation

**Clone the repository**

```bash
git clone https://github.com/yourusername/unilag-inventory.git
cd unilag-inventory
```

**Backend Setup**

```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Frontend Setup**

```bash
cd frontend
npm install
npm start
```

The application should now be running at `http://localhost:3000`

---

## Usage

1. Register or log in to access the system
2. Navigate through the dashboard to view inventory status
3. Use the search feature to locate specific items
4. Check out items by selecting them and assigning to users or projects
5. Check in items when they are returned
6. Admins can add, edit, or remove inventory items

---

## Contact

For questions or support, please contact the Unilag Design Studio team.
