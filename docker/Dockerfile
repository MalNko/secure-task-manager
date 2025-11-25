# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["src/SecureTaskManager.API/SecureTaskManager.API.csproj", "SecureTaskManager.API/"]
RUN dotnet restore "SecureTaskManager.API/SecureTaskManager.API.csproj"

# Copy everything else and build
COPY src/SecureTaskManager.API/. SecureTaskManager.API/
WORKDIR /src/SecureTaskManager.API
RUN dotnet build "SecureTaskManager.API.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "SecureTaskManager.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 8080

# Security: Run as non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser /app
USER appuser

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SecureTaskManager.API.dll"]