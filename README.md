# Tabletop Oracle -- Web Frontend

Angular 17+ SPA for the Tabletop Oracle platform. Player and curator experiences.

## Setup

```bash
npm install
ng serve --proxy-config proxy.conf.json
```

Open http://localhost:4200. API requests proxy to http://localhost:8000.

## Development

```bash
ng test                    # Run tests
ng build                   # Development build
ng build --configuration=production  # Production build
npx eslint "src/**/*.ts"   # Lint
npx prettier --check "src/**/*.{ts,html,scss}"  # Format check
```

## Docker

```bash
docker build -t tabletop-oracle-web .
docker run -p 8080:80 tabletop-oracle-web
```
