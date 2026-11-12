# Build:  docker build -t brikkhorongon-api backend      Run: docker run -p 8080:8080 -e ConnectionStrings__Default=... -e Jwt__Key=... brikkhorongon-api
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY BrikkhoRongon.Api/BrikkhoRongon.Api.csproj BrikkhoRongon.Api/
RUN dotnet restore BrikkhoRongon.Api/BrikkhoRongon.Api.csproj
COPY . .
RUN dotnet publish BrikkhoRongon.Api/BrikkhoRongon.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS run
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_ENVIRONMENT=Production
# Render (and most hosts) tell us which port to listen on through $PORT.
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-8080} exec dotnet BrikkhoRongon.Api.dll"]
