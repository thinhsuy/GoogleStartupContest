# =========================
# Stage 1 - Build deps
# =========================
FROM python:3.11-slim AS builder
 
WORKDIR /app
 
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*
 
RUN pip install --upgrade pip poetry
RUN poetry config virtualenvs.create false
COPY pyproject.toml README.md .dockerignore /app/
COPY core /app/core
RUN poetry install --no-interaction --no-ansi --only main
 
# =========================
# Stage 2 - Final runtime
# =========================
FROM python:3.11-slim
 
WORKDIR /app
 
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*
 
ENV PYTHONUNBUFFERED=1
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY core /app/core
COPY . /app
EXPOSE 8080
CMD ["python", "core/main.py"]