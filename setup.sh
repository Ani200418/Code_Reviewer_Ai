#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# AI Code Reviewer — One-Command Setup Script
# Usage: bash setup.sh
# ─────────────────────────────────────────────────────────────────

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║     AI Code Reviewer — Setup          ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Check Node version
NODE_VER=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 || echo "0")
if [ "$NODE_VER" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ is required. Current: $(node -v 2>/dev/null || echo 'not found')${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# ─── Server setup ────────────────────────────────────────────────
echo -e "\n${BLUE}[1/4] Installing server dependencies...${NC}"
cd server
npm install --silent
echo -e "${GREEN}✅ Server packages installed${NC}"

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${YELLOW}⚠️  Created server/.env from template. Please fill in:${NC}"
  echo "      • MONGODB_URI"
  echo "      • OPENAI_API_KEY"
  echo "      • JWT_SECRET"
fi

# Create uploads dir
mkdir -p uploads
cd ..

# ─── Client setup ────────────────────────────────────────────────
echo -e "\n${BLUE}[2/4] Installing client dependencies...${NC}"
cd client
npm install --silent
echo -e "${GREEN}✅ Client packages installed${NC}"

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo -e "${GREEN}✅ Created client/.env.local${NC}"
fi
cd ..

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "\n${BLUE}─── Next Steps ──────────────────────────────────${NC}"
echo -e "  1. Edit ${YELLOW}server/.env${NC} and add your credentials"
echo -e "  2. ${BLUE}Terminal 1:${NC} cd server && npm run dev"
echo -e "  3. ${BLUE}Terminal 2:${NC} cd client && npm run dev"
echo -e "  4. Open ${GREEN}http://localhost:3000${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────${NC}\n"
