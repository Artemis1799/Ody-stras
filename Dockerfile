# ============================================
# Dockerfile for .NET Backend (t5-back)
# ============================================

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build

WORKDIR /src

# Copy project file and restore dependencies
COPY t5-back.csproj ./
RUN dotnet restore

# Copy all source code
COPY . .

# Build the application
RUN dotnet publish -c Release -o /app/publish

# ============================================
# Stage 2: Runtime
# ============================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime

WORKDIR /app

# Create directory for SQLite database
RUN mkdir -p /data

# Copy published application
COPY --from=build /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ConnectionStrings__DefaultConnection="Data Source=/data/database.db"

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1001 dotnet && \
    useradd --uid 1001 --gid 1001 --create-home dotnet && \
    chown -R dotnet:dotnet /app /data

USER dotnet

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl --fail http://localhost:5000/api/Event || exit 1

# Start the application (create db file if not exists)
CMD ["sh", "-c", "test -f /data/database.db || touch /data/database.db; dotnet t5-back.dll"]
