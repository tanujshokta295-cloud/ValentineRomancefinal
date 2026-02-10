from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import razorpay
import hmac
import hashlib

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=False)

# Create the main app
app = FastAPI(title="Valentine Proposal API")

# Add CORS middleware FIRST
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints - MUST be before other routes
@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes - returns 200 OK"""
    return JSONResponse(content={"status": "healthy"}, status_code=200)

@app.get("/api/health")
async def api_health_check():
    """Health check endpoint under /api prefix"""
    return JSONResponse(content={"status": "healthy"}, status_code=200)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'valentine_db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Razorpay client
razorpay_key_id = os.environ.get('RAZORPAY_KEY_ID', '')
razorpay_key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')
razorpay_client = None
if razorpay_key_id and razorpay_key_secret:
    razorpay_client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class ProposalCreate(BaseModel):
    valentine_name: str = Field(..., min_length=1, max_length=100)
    custom_message: Optional[str] = Field(default="Will you be my Valentine?", max_length=500)
    character_choice: str = Field(default="bear")

class ProposalResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    valentine_name: str
    custom_message: str
    character_choice: str
    created_at: str
    accepted: Optional[bool] = None
    accepted_at: Optional[str] = None
    paid: bool = False

class ProposalUpdate(BaseModel):
    accepted: bool

class PaymentOrderCreate(BaseModel):
    valentine_name: str
    custom_message: Optional[str] = "Will you be my Valentine?"
    character_choice: str = "bear"

class PaymentOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
    proposal_id: str

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    proposal_id: str

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Payment amount in paise (default ₹149 = 14900 paise)
DEFAULT_PAYMENT_AMOUNT = 14900

# Settings endpoints
@api_router.get("/settings/pricing")
async def get_pricing():
    """Get current pricing settings"""
    try:
        settings = await db.settings.find_one({"key": "pricing"}, {"_id": 0})
        if not settings:
            default_settings = {
                "key": "pricing",
                "amount": DEFAULT_PAYMENT_AMOUNT,
                "currency": "INR",
                "display_price": "₹149"
            }
            await db.settings.insert_one(default_settings)
            return {
                "amount": DEFAULT_PAYMENT_AMOUNT,
                "currency": "INR",
                "display_price": "₹149"
            }
        return {
            "amount": settings.get("amount", DEFAULT_PAYMENT_AMOUNT),
            "currency": settings.get("currency", "INR"),
            "display_price": settings.get("display_price", "₹149")
        }
    except Exception as e:
        logger.error(f"Error getting pricing: {e}")
        return {
            "amount": DEFAULT_PAYMENT_AMOUNT,
            "currency": "INR",
            "display_price": "₹149"
        }

@api_router.post("/settings/pricing")
async def update_pricing(amount: int, display_price: str):
    """Update pricing - amount in paise (e.g., 14900 for ₹149)"""
    await db.settings.update_one(
        {"key": "pricing"},
        {"$set": {
            "key": "pricing",
            "amount": amount,
            "currency": "INR",
            "display_price": display_price,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"success": True, "amount": amount, "display_price": display_price}

async def get_current_price():
    """Helper to get current price from settings"""
    try:
        settings = await db.settings.find_one({"key": "pricing"}, {"_id": 0})
        if settings:
            return settings.get("amount", DEFAULT_PAYMENT_AMOUNT)
    except Exception:
        pass
    return DEFAULT_PAYMENT_AMOUNT

# Payment endpoints
@api_router.post("/payments/create-order", response_model=PaymentOrderResponse)
async def create_payment_order(input: PaymentOrderCreate):
    """Create a Razorpay order and a pending proposal"""
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment gateway not configured")
    
    try:
        current_price = await get_current_price()
        
        proposal_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        
        proposal_doc = {
            "id": proposal_id,
            "valentine_name": input.valentine_name,
            "custom_message": input.custom_message or "Will you be my Valentine?",
            "character_choice": input.character_choice,
            "created_at": created_at,
            "accepted": None,
            "accepted_at": None,
            "paid": False,
            "payment_status": "pending"
        }
        
        await db.proposals.insert_one(proposal_doc)
        
        order_data = {
            "amount": current_price,
            "currency": "INR",
            "receipt": f"proposal_{proposal_id[:8]}",
            "notes": {
                "proposal_id": proposal_id,
                "valentine_name": input.valentine_name
            }
        }
        
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        await db.payments.insert_one({
            "order_id": razorpay_order["id"],
            "proposal_id": proposal_id,
            "amount": current_price,
            "currency": "INR",
            "status": "created",
            "created_at": created_at
        })
        
        return PaymentOrderResponse(
            order_id=razorpay_order["id"],
            amount=current_price,
            currency="INR",
            key_id=razorpay_key_id,
            proposal_id=proposal_id
        )
        
    except Exception as e:
        logger.error(f"Error creating payment order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")

@api_router.post("/payments/verify")
async def verify_payment(input: PaymentVerify):
    """Verify Razorpay payment signature and activate proposal"""
    try:
        message = f"{input.razorpay_order_id}|{input.razorpay_payment_id}"
        
        generated_signature = hmac.new(
            razorpay_key_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != input.razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        await db.payments.update_one(
            {"order_id": input.razorpay_order_id},
            {"$set": {
                "payment_id": input.razorpay_payment_id,
                "signature": input.razorpay_signature,
                "status": "paid",
                "paid_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        await db.proposals.update_one(
            {"id": input.proposal_id},
            {"$set": {
                "paid": True,
                "payment_status": "completed",
                "payment_id": input.razorpay_payment_id
            }}
        )
        
        proposal = await db.proposals.find_one({"id": input.proposal_id}, {"_id": 0})
        
        return {
            "success": True,
            "message": "Payment verified successfully",
            "proposal_id": input.proposal_id,
            "proposal": proposal
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to verify payment: {str(e)}")

# Proposal endpoints
@api_router.post("/proposals", response_model=ProposalResponse)
async def create_proposal(input: ProposalCreate):
    """Create a proposal"""
    proposal_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "id": proposal_id,
        "valentine_name": input.valentine_name,
        "custom_message": input.custom_message or "Will you be my Valentine?",
        "character_choice": input.character_choice,
        "created_at": created_at,
        "accepted": None,
        "accepted_at": None,
        "paid": True
    }
    
    await db.proposals.insert_one(doc)
    
    return ProposalResponse(
        id=proposal_id,
        valentine_name=doc["valentine_name"],
        custom_message=doc["custom_message"],
        character_choice=doc["character_choice"],
        created_at=created_at,
        accepted=None,
        accepted_at=None,
        paid=True
    )

@api_router.get("/proposals/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(proposal_id: str):
    proposal = await db.proposals.find_one({"id": proposal_id}, {"_id": 0})
    
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    return ProposalResponse(**proposal)

@api_router.patch("/proposals/{proposal_id}", response_model=ProposalResponse)
async def update_proposal(proposal_id: str, update: ProposalUpdate):
    proposal = await db.proposals.find_one({"id": proposal_id}, {"_id": 0})
    
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    accepted_at = datetime.now(timezone.utc).isoformat() if update.accepted else None
    
    await db.proposals.update_one(
        {"id": proposal_id},
        {"$set": {"accepted": update.accepted, "accepted_at": accepted_at}}
    )
    
    proposal["accepted"] = update.accepted
    proposal["accepted_at"] = accepted_at
    
    return ProposalResponse(**proposal)

@api_router.get("/proposals", response_model=List[ProposalResponse])
async def list_proposals(page: int = 1, limit: int = 50):
    """List proposals with pagination"""
    limit = min(limit, 100)
    skip = (page - 1) * limit
    proposals = await db.proposals.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [ProposalResponse(**p) for p in proposals]

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Valentine Proposal API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(page: int = 1, limit: int = 50):
    """Get status checks with pagination"""
    limit = min(limit, 100)
    skip = (page - 1) * limit
    status_checks = await db.status_checks.find({}, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
