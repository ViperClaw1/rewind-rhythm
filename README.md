# Rewind Rhythm

A timed trivia game covering Hip-Hop, Movies, TV and R'n'B. Answer each question within 10 seconds, keep your microphones (lives), and climb from Base to Diamond.

## Project info

**URL**: <YOUR_PROJECT_URL>

## How can I edit this code?

There are several ways of editing this application. Changes pushed to the repository from any of them become part of the project.

**Use your preferred IDE**

Clone this repo, work locally, and push your changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Create a .env file with your Supabase project's credentials.
# VITE_SUPABASE_URL=<YOUR_SUPABASE_URL>
# VITE_SUPABASE_PUBLISHABLE_KEY=<YOUR_SUPABASE_PUBLISHABLE_KEY>

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## How can I deploy this project?

Run `npm run build` and publish the generated `dist` folder to any static hosting provider. Set the environment variables above on your host, and configure it to serve `index.html` for all routes so that client-side routing works.

## Can I connect a custom domain to this project?

Yes, you can!

To connect a domain, open your hosting provider's domain settings, add the domain, and update your DNS records as instructed there.
