# kikionolo

A modern React Native/Expo app for LPG gas delivery and communication, powered by Supabase.

## Features

- Real-time chat with staff
- AI assistant (Chatbase)
- Order management and checkout
- Profile and settings
- Secure authentication
- Responsive UI for mobile and web

## Getting Started

### Prerequisites

- Node.js (18+ recommended)
- Yarn or npm
- Expo CLI (`npm install -g expo-cli`)

### Setup

1. Clone the repo:
   ```sh
   git clone <repo-url>
   cd project-kiki-onolo-v1
   ```
2. Install dependencies:
   ```sh
   yarn install
   # or
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your Supabase and PayPal credentials.

### Running the App

- Start the Expo dev server:
  ```sh
  yarn dev
  # or
  npm run dev
  ```
- Open on your device with Expo Go, or run on iOS/Android simulators:
  ```sh
  yarn ios
  yarn android
  yarn web
  ```

### Linting & Formatting

- Lint code:
  ```sh
  yarn lint
  ```
- Format code:
  ```sh
  yarn format
  ```

### Testing

- (Coming soon) Run tests:
  ```sh
  yarn test
  ```

### Deployment

- Build for production with Expo EAS or classic build:
  ```sh
  expo build:android
  expo build:ios
  # or use EAS Build
  eas build --platform all
  ```

## Environment Variables

See `types/env.d.ts` for required variables:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`
- `EXPO_PUBLIC_PAYPAL_SECRET`

## Folder Structure

- `app/` - App screens and navigation
- `components/` - Reusable UI components
- `constants/` - Static config (colors, company info)
- `context/` - React context providers
- `lib/` - Supabase and other libraries
- `utils/` - Utility functions
- `types/` - TypeScript types
- `supabase/` - Database migrations

## Contributing

Pull requests welcome! Please lint and format your code before submitting.

## License

MIT
