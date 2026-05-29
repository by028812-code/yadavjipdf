FROM node:20-slim

# Install system dependencies: Python, LibreOffice, Ghostscript, etc.
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libreoffice \
    ghostscript \
    poppler-utils \
    java-common \
    default-jre \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip3 install --break-system-packages \
    PyPDF2 \
    pdf2docx \
    tabula-py \
    pdfplumber \
    openpyxl \
    xlsxwriter \
    python-docx \
    camelot-py \
    pandas

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install Node.js dependencies
RUN bun install --frozen-lockfile

# Copy application code
COPY . .

# Create upload and download directories
RUN mkdir -p /app/upload /app/download

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["bun", "run", "start"]
