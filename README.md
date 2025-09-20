# Global Solidarity Calendar

A platform for discovering and sharing solidarity events worldwide.

## Features

- Browse and search for solidarity events
- Submit new events for moderation
- Moderation dashboard for approved contributors
- Real-time event updates
- Responsive design

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd project
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your Firebase credentials and moderator settings.

### Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password and Google providers
3. Enable Firestore Database
4. Copy your Firebase config values to the `.env` file

### Moderator Setup

To set up moderator access securely:

1. **Choose a moderator email and password** that will have access to the moderation dashboard
2. **Update your `.env` file** with the moderator credentials:
```env
VITE_MODERATOR_EMAIL=your_moderator_email@example.com
VITE_MODERATOR_PASSWORD=your_secure_password
```

3. **Important Security Notes:**
   - The `.env` file is already in `.gitignore` and will NOT be committed to your public GitHub repository
   - Never commit actual credentials to version control
   - Use a strong, unique password for the moderator account
   - Consider using a dedicated email address for moderation

4. **First Time Setup:**
   - After setting the moderator credentials in `.env`
   - Run the application
   - Sign up or sign in with the moderator email/password
   - The system will automatically assign moderator role to this email

### Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API and authentication services
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
└── config/        # Configuration files
```

## Security Considerations

- **Environment Variables:** All sensitive data (API keys, passwords) are stored in `.env` files that are gitignored
- **Moderator Access:** Only users with the specified moderator email can access the moderation dashboard
- **Firebase Security:** Firestore rules restrict data access based on user roles
- **Public Repository:** The code is safe to make public as credentials are not committed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Your License Here]