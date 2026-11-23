# Deploy EduManage with Render and Neon

EduManage uses Render for the Laravel backend, Vercel for the React frontend, and Neon for its production database:

- **Backend:** Render Web Service using the Dockerfile in `Backend/`
- **Database:** Neon PostgreSQL
- **Frontend:** Vercel project using `Frontend/`

The local Docker Compose setup remains on MySQL. The Docker image includes both MySQL and PostgreSQL PDO drivers so local development keeps working while Render can connect to Neon.

## 1. Create a Neon database

Create a Neon project and database. In the Neon dashboard, open **Connect** and copy the connection string. Use the pooled connection string if available. Keep it secret; do not commit it or put it in the frontend environment.

## 2. Deploy the Laravel backend

In Render, create a **Web Service** from the `Lorinz123/eduManage` repository:

- Runtime: **Docker**
- Root Directory: `Backend`
- Health Check Path: `/up`

The container runs `php artisan migrate --force` at startup before serving requests, so the Neon schema is created automatically. This avoids relying on Render's pre-deploy command, which is only available on paid services.

Set these environment variables in the service's Render dashboard:

| Key | Value |
| --- | --- |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | Output of `php artisan key:generate --show` |
| `APP_URL` | The backend's Render URL, such as `https://edumanage-api.onrender.com` |
| `DB_CONNECTION` | `pgsql` |
| `DATABASE_URL` | The Neon connection string copied in step 1 |
| `DB_SSLMODE` | `require` |
| `CORS_ALLOWED_ORIGINS` | The frontend's Render URL; set after step 3 |

`APP_KEY` can be generated locally from `Backend/` with `php artisan key:generate --show`. Use the output as a Render secret. Do not publish `.env` or the Neon connection string.

The first backend startup applies the Laravel migrations to the empty Neon database. Your local MySQL records are not copied to Neon; register a new teacher account on the deployed app after setup.

## 3. Deploy the React frontend to Vercel

In Vercel, import the `Lorinz123/eduManage` repository and configure the project:

- Framework Preset: **Vite**
- Root Directory: `Frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable `VITE_API_URL`: `https://<backend-service>.onrender.com/api`

The `Frontend/vercel.json` rewrite sends app routes to `index.html` so React Router paths work on direct visits and refresh.

Add `VITE_API_URL` for Production, Preview, and Development as appropriate. It is embedded in the frontend at build time; redeploy after changing it.

## 4. Connect frontend and backend

After Vercel gives the frontend its URL, set `CORS_ALLOWED_ORIGINS` on the Render backend to that exact origin (for example, `https://edumanage.vercel.app`, with no trailing slash). Save and redeploy the backend.

The frontend embeds `VITE_API_URL` at build time, so update it in the Vercel project's environment settings and trigger a new deployment whenever the backend URL changes.

## Local development

Continue using the existing Docker Compose setup in `Backend/` for local MySQL. The Neon settings are only for the deployed service; do not replace the local Compose database credentials with Neon secrets.
