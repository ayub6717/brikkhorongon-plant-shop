# BrikkhoRongon API (ASP.NET Core · .NET 10 · PostgreSQL)

The storefront (Next.js, repo root) stays on Vercel. This folder is the server it will talk to.
It lives in `backend/` (not `api/`) because Vercel reserves a root `api/` folder for its own functions.

## What exists so far
- `GET /api/products?category=&light=&level=&q=&sort=&lang=bn` — the plant catalog
- `GET /api/products/{slug}` — one plant
- `POST /api/auth/register`, `POST /api/auth/login` — accounts (Identity, hashed passwords, lockout after 5 wrong tries, 10 calls/min per IP)
- `GET/PUT /api/me`, `POST /api/me/addresses`, `DELETE /api/me/addresses/{id}` — need `Authorization: Bearer <token>`
- `GET /health`, `/openapi/v1.json`, `/swagger` and `/scalar/v1` (click-to-try pages, Development only)

## One-time setup (run in the VS Code terminal)

```bash
# 1. EF Core command line tool (creates the database tables for us)
dotnet tool install --global dotnet-ef
# If `dotnet-ef` is not found afterwards, add this to ~/.zshrc and open a new terminal:
#   export PATH="$PATH:$HOME/.dotnet/tools"

cd backend/BrikkhoRongon.Api

# 2. Give the API the database address + password WITHOUT writing the password in a command
#    (it is typed at a hidden prompt, so it never lands in shell history or git):
read -s "PW?Postgres password: "; echo
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=brikkhorongon;Username=postgres;Password=$PW"
unset PW

# 2b. A secret key that signs login tokens (generated randomly, never shown or stored in git):
dotnet user-secrets set "Jwt:Key" "$(openssl rand -base64 48)"

# 3. Create the first migration (a C# file describing the tables)
dotnet ef migrations add InitialCreate
```

## Run

```bash
cd backend/BrikkhoRongon.Api
dotnet run
```

In Development the API applies migrations and loads the 41 plants on startup (only when the table is empty).
Then open http://localhost:5080/scalar/v1 and try `GET /api/products`.

## Where things live
| Path | What it is |
|---|---|
| `Domain/Product.cs` | the Product class = one row of the `products` table |
| `Data/AppDbContext.cs` | tells EF Core how classes map to tables |
| `Data/Seed/products.json` | the starting catalog (generated from the storefront's `src/data`) |
| `Endpoints/CatalogEndpoints.cs` | the URLs above |
| `Domain/AppUser.cs`, `Domain/Address.cs` | account + saved address tables |
| `Auth/TokenService.cs` | creates the signed login token (JWT) |
| `Endpoints/AuthEndpoints.cs` | register, login, profile, addresses |
| `Program.cs` | start-up: database, CORS, OpenAPI, endpoints |

## Adding a migration later
Whenever a class under `Domain/` changes: `dotnet ef migrations add <ShortName>` then `dotnet run` (it applies it in Development).

## How the storefront talks to this API
The browser never calls this API directly. It calls `/api/bff/*` on the Next.js site; those route handlers
(`src/app/api/bff`, `src/lib/server/backend.ts`) forward the request here and keep the login token in an
httpOnly cookie, so page JavaScript can never read it.

Local setup: `.env.local` in the repo root (git-ignored) contains
```
NEXT_PUBLIC_USE_API=true
API_URL=http://localhost:5080
```
Run two terminals: `yarn dev` (repo root) and `dotnet run` (`backend/BrikkhoRongon.Api`).
Without `NEXT_PUBLIC_USE_API=true` the site falls back to the browser-only demo (what Vercel runs today).

## Orders (server decides the money)
`POST /api/orders` takes only *what* was bought (plant slugs + quantities), the coupon code and the delivery details.
It never takes a price: `Services/Pricing.cs` (a port of the storefront's coupon/shipping rules) works out the
discount, delivery fee and total from the catalog in the database. Guests and signed-in customers can both order.

| Endpoint | Who | What |
|---|---|---|
| `POST /api/orders` | anyone | place an order |
| `GET /api/orders/{id}` | anyone with the order number | track an order |
| `POST /api/orders/lookup` | anyone | several order numbers at once (a guest's recent orders) |
| `POST /api/orders/{id}/requests` | anyone with the order number | ask for a change before it ships |
| `GET /api/me/orders` | signed in | all orders on my account |
| `POST /api/admin/orders/{id}/advance` | Admin role | move the order to the next stage |
| `POST /api/admin/orders/{id}/requests/{rid}/resolve` | Admin role | approve or decline a change |

Order numbers are `BRK-` + 8 random characters, so for guests the number itself is the tracking key.

### Creating the shop-team (Admin) account for development
```bash
cd backend/BrikkhoRongon.Api
dotnet user-secrets set "Admin:Email" "admin@brikkhorongon.test"
read -s "PW?Admin password: "; echo
dotnet user-secrets set "Admin:Password" "$PW"
unset PW
```
On the next `dotnet run` in Development the account is created and given the Admin role.

## Admin dashboard
`GET /api/admin/stats` (counts, order value, status breakdown, last 7 days, best sellers) and
`GET /api/admin/orders?status=&q=&page=` (paged list) feed the storefront's `/admin` page. Admin role only.
No migration is needed for these: they only read existing tables.
