# Railway will use this to build and run the frontend
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy application
COPY . .

# Build the app
RUN yarn build

# Install serve to run the built app
RUN yarn global add serve

# Expose port
EXPOSE 3000

# Serve the built app
CMD ["serve", "-s", "build", "-l", "3000"]
