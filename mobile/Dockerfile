# Use Flutter SDK as build environment
FROM flutter:3.19 AS builder

# Set working directory
WORKDIR /app

# Copy pubspec files
COPY pubspec.yaml pubspec.lock ./

# Get Flutter packages
RUN flutter pub get

# Copy source code
COPY . .

# Build APK for release
RUN flutter build apk --release

# Use smaller base image for final stage
FROM alpine:latest

# Install JRE for running Flutter app
RUN apk --no-cache add openjdk11-jre

# Create app directory
WORKDIR /app

# Copy built APK from builder stage
COPY --from=builder /app/build/app/outputs/flutter-apk/app-release.apk ./app.apk

# Expose port (if needed for testing)
EXPOSE 8080

CMD ["sh", "-c", "echo 'APK is ready at /app/app.apk' && sleep infinity"]