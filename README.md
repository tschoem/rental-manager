# Rental Manager

An open-source Next.js application to host your Airbnb rooms and properties yourself. Re-take ownership of your properties by building a dedicated website with a simple CMS, calendar synchronization, and direct booking capabilities.

**Repository**: [https://github.com/tschoem/rental-manager](https://github.com/tschoem/rental-manager)

## 🚀 Features

### Core Features
- **Property & Room Management**: Create and manage multiple properties with rooms
- **Airbnb Integration**: 
  - Import listings directly from Airbnb URLs (scrapes title, description, images, amenities, and pricing)
  - Calendar synchronization via iCal URLs for real-time availability
  - Link back to Airbnb listings
- **Content Management System (CMS)**:
  - Customize Home page (hero section, features, about, rooms/properties, CTA)
  - Customize Location page (area descriptions, images, maps)
  - Customize About page (owner profiles, social media links)
  - Drag-and-drop feature ordering
  - Image upload with cropping
- **Booking System**:
  - Direct booking requests from guests
  - Calendar view showing availability
  - Booking status management (Pending, Confirmed, Cancelled)
  - Email notifications for booking requests
- **Calendar Sync**: 
  - Sync with Airbnb calendars via iCal URLs
  - Block dates automatically based on bookings
  - Show real-time availability on room pages
- **Authentication**: 
  - Secure admin authentication with NextAuth.js
  - Password reset functionality
  - Session management
- **Email Functionality**:
  - Password reset emails
  - Booking request notifications
  - SMTP configuration support
- **SEO & Customization**:
  - SEO settings (meta description, keywords, author)
  - Site configuration (name, icon, URL, currency)
  - Single property mode for focused sites

## 📋 Requirements

### System Requirements
- **Node.js**: 18.x or higher
- **npm** or **yarn** or **pnpm**
- **SQLite** (default) or **PostgreSQL** / **MySQL** (for production)

### Environment Variables
The following environment variables are required:

#### Required
- `DATABASE_URL`: Database connection string
  - SQLite: `file:./dev.db` or `file:./prisma/dev.db`
  - PostgreSQL: `postgresql://user:password@localhost:5432/dbname`
  - MySQL: `mysql://user:password@localhost:3306/dbname`
- `NEXTAUTH_SECRET`: Secret key for NextAuth.js (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your application URL (auto-detected in development)

#### Optional (for email functionality)
- `SMTP_HOST`: SMTP server hostname (e.g., `smtp.gmail.com`)
- `SMTP_PORT`: SMTP port (e.g., `587`)
- `SMTP_SECURE`: `true` or `false` (use `false` for port 587)
- `SMTP_USER`: SMTP username/email
- `SMTP_PASSWORD`: SMTP password (use App Password for Gmail)
- `SMTP_FROM_EMAIL`: Email address to send from
- `ADMIN_EMAIL`: Admin email for notifications

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/tschoem/rental-manager.git
cd rental-manager
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Email (Optional - for password reset and booking notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM_EMAIL="your-email@gmail.com"
ADMIN_EMAIL="admin@example.com"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Initialize the Database
Run the setup script to create the database schema:

```bash
npm run setup
```

This will:
- Create the database file (if using SQLite)
- Run Prisma migrations
- Set up all required tables

### 5. Create Admin User
After the database is initialized, you'll be prompted to create an admin user through the setup screen at `http://localhost:3000`, or you can use the CLI:

```bash
npm run setup-admin
```

### 6. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### Initial Setup
1. Visit `http://localhost:3000` - you'll see the setup screen if configuration is incomplete
2. Complete all required setup steps:
   - Configure `DATABASE_URL` in `.env`
   - Run `npm run setup` to initialize database
   - Configure `NEXTAUTH_SECRET` in `.env`
   - Create admin user via the setup form
3. (Optional) Configure SMTP settings for email functionality

### Admin Dashboard
Access the admin dashboard at `/admin` after logging in.

#### Managing Properties
1. Go to **Properties** in the admin menu
2. Click **Add Property** to create a new property
3. Add rooms to properties:
   - Click on a property
   - Click **Add Room** or **Import from Airbnb**
   - For Airbnb import, paste the listing URL and optionally provide:
     - Gallery URL (for better image scraping)
     - iCal URL (for calendar sync)

#### Importing from Airbnb
1. Navigate to a property
2. Click **Import Room from Airbnb**
3. Enter the Airbnb listing URL
4. (Optional) Provide gallery URL for better image extraction
5. (Optional) Provide iCal calendar URL for availability sync
6. Click **Import** - the system will automatically extract:
   - Title and description
   - Images
   - Amenities
   - Pricing
   - Capacity

#### Customizing Pages
- **Home Page** (`/admin/home`): Edit hero section, features, about section, rooms section, and CTA
- **Location Page** (`/admin/location`): Edit area descriptions, images, and map
- **About Page** (`/admin/about`): Manage owner profiles and social media links

#### Managing Bookings
- View booking requests in the admin dashboard
- Update booking status (Pending → Confirmed/Cancelled)
- Bookings are automatically synced with calendar availability

### Public Pages
- **Home** (`/`): Main landing page with properties/rooms
- **Properties** (`/properties/[id]`): Individual property pages
- **Rooms** (`/rooms/[id]`): Individual room pages with booking calendar
- **Location** (`/location`): Location information page
- **About** (`/about`): About page with owner information

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub/GitLab/Bitbucket**

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. **Configure Environment Variables**:
   - In Vercel project settings, add all environment variables from your `.env` file
   - For production, use a PostgreSQL database (recommended)
   - Update `DATABASE_URL` to your production database
   - Set `NEXTAUTH_URL` to your production domain

4. **Deploy**:
   - Vercel will automatically build and deploy
   - After deployment, run migrations:
     ```bash
     npx prisma migrate deploy
     ```
   - Or use Vercel's build command to run migrations:
     ```json
     {
       "scripts": {
         "build": "prisma migrate deploy && next build"
       }
     }
     ```

### Other Platforms

#### Railway
1. Create a new project on Railway
2. Connect your GitHub repository
3. Add environment variables
4. Railway will automatically detect Next.js and deploy
5. Add a PostgreSQL database service
6. Update `DATABASE_URL` to the PostgreSQL connection string

#### Docker
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t rental-manager .
docker run -p 3000:3000 --env-file .env rental-manager
```

#### Self-Hosted (VPS)
1. Set up Node.js on your server
2. Clone the repository
3. Install dependencies: `npm install`
4. Set up environment variables
5. Run `npm run setup` to initialize database
6. Build: `npm run build`
7. Start: `npm start`
8. Use PM2 or similar for process management:
   ```bash
   npm install -g pm2
   pm2 start npm --name "rental-manager" -- start
   pm2 save
   pm2 startup
   ```

### Database Migration
For production databases (PostgreSQL/MySQL), run migrations:

```bash
npx prisma migrate deploy
```

Or include in your build process:
```bash
npx prisma migrate deploy && npm run build
```

### Production Checklist
- [ ] Use PostgreSQL or MySQL (not SQLite) for production
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure `NEXTAUTH_URL` to your production domain
- [ ] Set up SMTP for email functionality
- [ ] Configure proper CORS settings if needed
- [ ] Set up SSL/HTTPS
- [ ] Configure backup strategy for database
- [ ] Set up monitoring and logging
- [ ] Review and update SEO settings
- [ ] Test booking flow end-to-end

## 🧪 Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run setup`: Initialize database schema
- `npm run setup-admin`: Create admin user via CLI
- `npm run list-users`: List all users
- `npm run delete-user`: Delete a user

### Project Structure
```
rental_manager/
├── app/                          # Next.js app directory
│   ├── _components/              # Shared components
│   │   ├── AdminSetupForm.tsx    # Admin setup form
│   │   ├── Footer.tsx            # Site footer
│   │   ├── Header.tsx            # Site header
│   │   ├── ImageUploadWithCrop.tsx # Image upload with cropping
│   │   ├── RotatingHero.tsx      # Hero section component
│   │   └── SetupPage.tsx         # Setup wizard page
│   ├── actions/                  # Server actions
│   │   ├── password-reset.ts     # Password reset actions
│   │   ├── setup-admin.ts        # Admin setup actions
│   │   └── actions.ts            # General server actions
│   ├── admin/                    # Admin dashboard
│   │   ├── _components/          # Admin shared components
│   │   ├── about/                # About page management
│   │   │   ├── _components/      # About page components
│   │   │   └── owners/           # Owner management
│   │   ├── home/                 # Home page editor
│   │   │   └── _components/      # Home page components
│   │   ├── location/              # Location page editor
│   │   │   └── _components/      # Location page components
│   │   ├── properties/           # Property management
│   │   │   ├── _components/      # Property components
│   │   │   └── [id]/             # Individual property pages
│   │   │       ├── import/       # Airbnb import
│   │   │       └── rooms/       # Room management
│   │   ├── rooms/                # Room management
│   │   │   ├── _components/      # Room components
│   │   │   └── [id]/             # Individual room pages
│   │   ├── settings/             # Site settings
│   │   │   └── _components/      # Settings components
│   │   ├── actions.ts            # Admin server actions
│   │   ├── layout.tsx            # Admin layout
│   │   └── page.tsx              # Admin dashboard
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication API
│   │   │   └── [...nextauth]/    # NextAuth.js routes
│   │   ├── rooms/                # Room API endpoints
│   │   │   └── [id]/
│   │   │       └── availability/ # Calendar availability API
│   │   └── upload-image/         # Image upload API
│   ├── auth/                     # Authentication pages
│   │   ├── forgot-password/      # Password reset request
│   │   ├── reset-password/       # Password reset form
│   │   └── signin/               # Sign in page
│   ├── properties/               # Public property pages
│   │   └── [id]/                 # Individual property page
│   │       └── _components/      # Property page components
│   ├── rooms/                    # Public room pages
│   │   └── [id]/                 # Individual room page
│   │       └── _components/      # Room page components
│   ├── about/                    # About page
│   ├── location/                 # Location page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── providers.tsx             # React providers
│   └── globals.css               # Global styles
├── lib/                          # Utility libraries
│   ├── airbnb-scraper.ts         # Airbnb listing scraper
│   ├── auth.ts                   # Authentication utilities
│   ├── db-check.ts               # Database connection check
│   ├── db-path.ts                # Database path utilities
│   ├── download-image.ts         # Image download utility
│   ├── email.ts                  # Email sending utilities
│   ├── gemini.ts                 # Google Gemini AI integration
│   ├── ical.ts                   # iCal calendar parsing
│   ├── prisma.ts                 # Prisma client instance
│   ├── setup-status.ts           # Setup status checker
│   └── social-media-scanner.ts   # Social media profile scanner
├── prisma/                       # Database
│   ├── schema.prisma             # Prisma schema definition
│   └── dev.db                    # SQLite database (dev)
├── scripts/                      # CLI scripts
│   ├── setup.ts                  # Database setup script
│   ├── setup-admin.ts            # Admin user creation
│   ├── list-users.ts             # List all users
│   ├── delete-user.ts            # Delete user script
│   ├── update-property-admin.ts   # Update property admin
│   ├── list-gemini-models.ts     # List Gemini models
│   └── debug-scraper.ts          # Debug Airbnb scraper
├── public/                       # Static assets
│   ├── hero-rentalmanager*.png   # Hero images
│   ├── location*.png             # Location images
│   ├── home-hero-images/         # Home page hero images
│   ├── property-images/          # Property images
│   ├── room-images/              # Room images
│   └── owner-images/             # Owner profile images
├── generated/                    # Generated Prisma client
│   └── client/                   # Prisma client code
├── types/                        # TypeScript type definitions
│   └── next-auth.d.ts           # NextAuth type extensions
├── .env                          # Environment variables (not in repo)
├── LICENSE                       # MIT License
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
└── README.md                     # This file
```

## 🔧 Configuration

### Single Property Mode
Enable single property mode in Site Settings to focus on one property:
- Rooms are displayed directly on the home page
- Property navigation is simplified

### Currency Settings
Configure currency in Site Settings:
- Currency code (EUR, USD, GBP, etc.)
- Currency symbol

### SEO Settings
Configure SEO in Site Settings:
- Meta description
- Meta keywords
- Site author

## 🐛 Troubleshooting

### Database Issues
- **Database not found**: Run `npm run setup` to initialize
- **Migration errors**: Check your `DATABASE_URL` and ensure database exists
- **Connection errors**: Verify database credentials and network access

### Authentication Issues
- **Can't log in**: Verify `NEXTAUTH_SECRET` is set correctly
- **Session errors**: Clear browser cookies and try again
- **Password reset not working**: Check SMTP configuration

### Import Issues
- **Airbnb import fails**: 
  - Check if the URL is valid
  - Try providing a gallery URL manually
  - Some listings may require authentication
- **Images not importing**: Verify the gallery URL or add images manually

### Calendar Sync Issues
- **Calendar not updating**: Verify iCal URL is correct and accessible
- **Dates not blocking**: Check iCal URL format and ensure it's publicly accessible

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! We appreciate all contributions, whether they're:

- 🐛 Bug reports
- 💡 Feature suggestions
- 📝 Documentation improvements
- 🔧 Code contributions
- 🎨 UI/UX improvements
- 🌍 Translations

### How to Contribute

1. **Fork the repository** from [https://github.com/tschoem/rental-manager](https://github.com/tschoem/rental-manager)
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Commit your changes**: `git commit -m 'Add some amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Write clear commit messages
- Add tests if applicable
- Update documentation as needed
- Be respectful and constructive in discussions

We're happy to help you get started! Feel free to open an issue if you have questions or need guidance.

## 📧 Support

For support, please open an issue on the [GitHub project](https://github.com/tschoem/rental-manager/issues).

- 🐛 **Bug Reports**: Use the bug report template
- 💡 **Feature Requests**: Use the feature request template
- ❓ **Questions**: Open a discussion or issue with the question label
- 📖 **Documentation**: Check existing issues or open a new one for documentation improvements

We aim to respond to all issues in a timely manner. For urgent issues, please label them appropriately.

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
