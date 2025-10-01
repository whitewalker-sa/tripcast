## Run tests

Get inside the container

```bash

$ docker-compose run --rm app-dev sh

```

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Running the application

### Prerequisites

- Docker and Docker Compose installed on your system

### Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

### Spin up backend server



Navigate to the [API](http://localhost:3000) for the QraphQL Playground

```bash

$ docker compose up


$ docker compose up -d # Run in detached mod

# View logs
$ docker compose logs -f backend
$ docker compose logs -f postgres

# Stop all server
$ docker compose down

# Stop and remove volumes (WARNING: This will delete your database data)
$ docker compose down -v
```

### Environment Files

- `.env.example` - Example configuration

The Docker setup automatically uses `.env` which configures the database docker service name as `postgres`.

### Database Access

When running with Docker, the PostgreSQL database is available at:

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `tripcast`
- **Username**: `tripcast_user`
- **Password**: `tripcast_password`

You can connect to it using any PostgreSQL client or the command line:

```bash
docker compose exec postgres psql -U tripcast_user -d tripcast
```

### Troubleshooting

- If the database connection fails, ensure the PostgreSQL container is healthy: `docker compose ps`
- To reset the database, run: `docker compose down -v && docker compose up`
