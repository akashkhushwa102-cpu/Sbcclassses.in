#!/bin/bash
# Subscription System - Quick Verification Script

echo "🔍 SBC App - Subscription System Verification"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "📋 CHECKING FRONTEND INTEGRATION..."
echo ""

# Check if imports are present
if grep -q "import { SubscriptionComponent }" src/App.jsx; then
    echo -e "${GREEN}✅${NC} SubscriptionComponent imported"
else
    echo -e "${RED}❌${NC} SubscriptionComponent NOT imported"
fi

if grep -q "import { AdminPaymentDashboard }" src/App.jsx; then
    echo -e "${GREEN}✅${NC} AdminPaymentDashboard imported"
else
    echo -e "${RED}❌${NC} AdminPaymentDashboard NOT imported"
fi

# Check if case statements are updated
if grep -q 'SubscriptionComponent userId={user.id}' src/App.jsx; then
    echo -e "${GREEN}✅${NC} Student subscription route configured"
else
    echo -e "${RED}❌${NC} Student subscription route NOT configured"
fi

if grep -q 'AdminPaymentDashboard C={C}' src/App.jsx; then
    echo -e "${GREEN}✅${NC} Admin payment dashboard route configured"
else
    echo -e "${RED}❌${NC} Admin payment dashboard route NOT configured"
fi

echo ""
echo "📋 CHECKING BACKEND INTEGRATION..."
echo ""

# Check backend files exist
if [ -f "backend/controllers/subscriptionController.js" ]; then
    echo -e "${GREEN}✅${NC} subscriptionController.js exists"
else
    echo -e "${RED}❌${NC} subscriptionController.js NOT found"
fi

if [ -f "backend/routes/subscriptions.js" ]; then
    echo -e "${GREEN}✅${NC} subscriptions.js routes exist"
else
    echo -e "${RED}❌${NC} subscriptions.js NOT found"
fi

if grep -q "subscriptionRoutes" backend/server.js; then
    echo -e "${GREEN}✅${NC} Subscription routes imported in server.js"
else
    echo -e "${RED}❌${NC} Subscription routes NOT imported in server.js"
fi

if grep -q "/api/subscriptions" backend/server.js; then
    echo -e "${GREEN}✅${NC} Subscription API mounted"
else
    echo -e "${RED}❌${NC} Subscription API NOT mounted"
fi

echo ""
echo "📋 CHECKING FRONTEND COMPONENTS..."
echo ""

if [ -f "src/components/StudentSubscription.jsx" ]; then
    echo -e "${GREEN}✅${NC} StudentSubscription.jsx exists"
else
    echo -e "${RED}❌${NC} StudentSubscription.jsx NOT found"
fi

if [ -f "src/components/AdminPaymentDashboard.jsx" ]; then
    echo -e "${GREEN}✅${NC} AdminPaymentDashboard.jsx exists"
else
    echo -e "${RED}❌${NC} AdminPaymentDashboard.jsx NOT found"
fi

echo ""
echo "📋 CHECKING CONFIGURATION..."
echo ""

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅${NC} .env.local exists"
    
    if grep -q "PAYTM" .env.local || grep -q "RAZORPAY" .env.local; then
        echo -e "${YELLOW}⚠️${NC} Payment credentials may need to be configured"
    fi
else
    echo -e "${RED}❌${NC} .env.local NOT found"
fi

echo ""
echo "=============================================="
echo "VERIFICATION COMPLETE"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Start backend:  cd backend && node server.js"
echo "2. Start frontend: npm run dev"
echo "3. Login as student or admin"
echo "4. Test subscription features"
echo ""
echo "📖 Full guide: See SUBSCRIPTION_SETUP_COMPLETE.md"
echo "=============================================="
