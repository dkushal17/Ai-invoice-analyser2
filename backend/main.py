import os
import io
import re
import json
import uuid
import requests
from datetime import datetime
import logging

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

from groq import Groq
import pdfplumber

try:
    import pytesseract
    from pdf2image import convert_from_bytes
    HAS_OCR = True
except ImportError:
    HAS_OCR = False

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Invoice Analytics Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase: {e}")

# GROQ Client setup
try:
    client = Groq(api_key=GROQ_API_KEY)
except Exception as e:
    logger.error(f"Failed to initialize Groq: {e}")
    client = None

def extract_text_from_pdf(file_bytes):
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        logger.error(f"PDF extract error: {e}")
    return text

def ocr_pdf(file_bytes):
    if not HAS_OCR:
        return ""
    try:
        images = convert_from_bytes(file_bytes)
        text = ""
        for img in images:
            text += pytesseract.image_to_string(img)
        return text
    except Exception as e:
        logger.error(f"OCR error: {e}")
        return ""

def safe_json_parse(content):
    try:
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except Exception as e:
        print("JSON parse error:", e)
    return {}

def extract_invoice_number_regex(text):
    patterns = [
        r'Invoice\s*(No|Number|#)\s*[:\-]?\s*([A-Z0-9\-]+)',
        r'Bill\s*(No|Number)\s*[:\-]?\s*([A-Z0-9\-]+)',
        r'Document\s*(No)\s*[:\-]?\s*([A-Z0-9\-]+)',
        r'Challan\s*(No)\s*[:\-]?\s*([A-Z0-9\-]+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(2)

    return None

def extract_with_llm(text):
    if not client:
        raise Exception("Groq client not initialized (check GROQ_API_KEY)")
        
    prompt = f"""
You are an expert financial document AI.

Your job is to deeply analyze the invoice text and extract structured data.

----------------------------------------
🧠 STEP 1: UNDERSTAND THE DOCUMENT
----------------------------------------

- Read the FULL invoice carefully
- Identify:
  - Header (vendor, invoice info)
  - Line items (products/services)
  - Totals section

- Extract ALL possible data internally before selecting final output

----------------------------------------
🎯 INVOICE IDENTIFIER DETECTION (ROBUST)
----------------------------------------

The invoice identifier may appear under ANY of these labels:

PRIMARY LABELS:
- Invoice No
- Invoice Number
- Invoice #
- Bill No
- Bill Number

ALTERNATIVE LABELS:
- Ref No
- Reference No
- Document No
- Doc No
- Order ID
- Order Number
- Transaction ID
- Receipt No
- Voucher No
- Challan No
- Delivery Note No

RULES:

1. PRIORITY ORDER:
   - Invoice No / Invoice Number (highest)
   - Bill No
   - Document No
   - Others (fallback)

2. ALWAYS choose value CLOSEST to label

3. DO NOT confuse with:
   - GSTIN
   - Phone numbers
   - Dates
   - Amounts

4. Identifier is usually:
   - Alphanumeric
   - 6–25 characters
   - Example: S2700173269, INV-2026-001

5. If multiple IDs exist:
   - Choose the MOST prominent invoice identifier

----------------------------------------
📦 EXTRA DETAILS EXTRACTION
----------------------------------------

Extract additional useful fields if present:

- reference_number
- delivery_number
- gst_number
- payment_method
- customer_name
- address

Store them inside:

"extra_details": {{
  "reference_number": "",
  "delivery_number": "",
  "gst_number": "",
  "other_ids": []
}}

----------------------------------------
📦 STEP 3: PRODUCT + CATEGORY
----------------------------------------

- Identify main product/service from line items
- Use it to determine category

Examples:
- Mobile, Laptop → Electronics
- Software → SaaS
- Food → Food

----------------------------------------
💱 STEP 4: FINANCIAL DATA
----------------------------------------

Extract:

- subtotal → before tax
- tax → GST / VAT / CGST + SGST
- total → final payable amount

RULES:
- total ≈ subtotal + tax
- Prefer final payable amount if multiple totals exist

----------------------------------------
📅 STEP 5: DATE
----------------------------------------

- Extract invoice date
- Convert to YYYY-MM-DD format

----------------------------------------
💱 STEP 6: CURRENCY
----------------------------------------

Detect:
- ₹ → INR
- $ → USD
- € → EUR

----------------------------------------
🚨 OUTPUT RULES (STRICT)
----------------------------------------

- Return ONLY JSON
- No explanation
- No markdown
- No extra text

----------------------------------------
📤 FINAL OUTPUT FORMAT
----------------------------------------

Return EXACTLY:

{{
  "invoice_number": string,
  "vendor": string,
  "date": string,
  "total": number,
  "subtotal": number,
  "tax": number,
  "currency": string,
  "category": string,
  "extra_details": {{
    "reference_number": string,
    "delivery_number": string,
    "gst_number": string,
    "other_ids": array
  }}
}}

----------------------------------------
📄 INVOICE TEXT:
{text[:4000]}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    content = response.choices[0].message.content
    data = safe_json_parse(content)

    print("LLM RAW OUTPUT:", content)
    print("EXTRACTED INVOICE NUMBER:", data.get("invoice_number"))

    if not data.get("invoice_number"):
        data["invoice_number"] = extract_invoice_number_regex(text)

    # Ensure extra_details exists
    data["extra_details"] = data.get("extra_details", {})
    print("EXTRA DETAILS:", data.get("extra_details"))

    return data

def convert_to_inr(amount, currency):
    try:
        amount = float(amount or 0)
    except ValueError:
        amount = 0.0
        
    currency = currency.strip().upper() if currency else "INR"
    if currency == "INR":
        return amount

    try:
        url = f"https://api.exchangerate-api.com/v4/latest/{currency}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        rate = data["rates"].get("INR")
        if rate:
            return amount * rate
    except Exception as e:
        print("Currency API Error:", str(e))
    return amount

def validate_data(data):
    if data.get("total") is not None and data.get("subtotal") is not None and data.get("tax") is not None:
        try:
            calc_total = float(data["subtotal"]) + float(data["tax"])
            if abs(calc_total - float(data["total"])) > 5:
                print("⚠️ Total mismatch detected")
        except Exception:
            pass
    return data

def generate_insights(data):
    insights = []
    
    # 1. Check for missing total
    if not data.get("total"):
        insights.append({
            "text": "Total amount missing",
            "type": "warning",  # Keep backwards comp mapping
            "severity": "high"
        })
        
    # 2. Check confidence
    if data.get("confidence") is not None and float(data.get("confidence", 1)) < 0.7:
        insights.append({
            "text": "Low confidence extraction",
            "type": "warning",
            "severity": "warning"
        })
        
    # 3. Tax checking
    if data.get("tax") in [0, 0.0, "0", None]:
        insights.append({
            "text": "No tax detected",
            "type": "warning",
            "severity": "warning"
        })
        
    # 4. Value checking
    if float(data.get("total", 0)) > 50000:
        insights.append({
            "text": "High value invoice",
            "type": "info",
            "severity": "info"
        })
        
    # 5. Currency reporting
    currency = data.get("currency", "INR")
    if currency and str(currency).upper() != "INR" and str(currency).upper() != "UNKNOWN":
        insights.append({
            "text": f"Converted from {str(currency).upper()} to INR",
            "type": "info",
            "severity": "info"
        })
        
    return insights

def normalize_text(value):
    if not value:
        return ""
    return re.sub(r'\s+', ' ', value).strip().lower()

def normalize_id(value):
    if not value:
        return ""
    return re.sub(r'[^a-zA-Z0-9]', '', value).lower()

def is_duplicate(new_inv, existing_invoices):
    new_id = normalize_id(new_inv.get("invoice_number"))

    for inv in existing_invoices:
        existing_id = normalize_id(inv.get("invoice_number"))

        if new_id and existing_id:
            if new_id == existing_id:
                return True

    return False

@app.post("/upload")
@app.post("/process-invoice")
async def upload_invoice(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        
        text = extract_text_from_pdf(file_bytes)
        if not text.strip():
            text = ocr_pdf(file_bytes)
            
        print("========== PDF TEXT ==========")
        print(text[:1000])
        
        if not text.strip():
            raise Exception("PDF text extraction failed")
            
        data = extract_with_llm(text)
        data = validate_data(data)
        
        if not data:
            raise Exception("LLM returned empty data")
            
        if data.get("total") in [0, None]:
            raise Exception("LLM failed to extract total")
            
        required_fields = ["vendor", "total"]
        for field in required_fields:
            if not data.get(field):
                raise Exception(f"Missing required field: {field}")
                
        currency = data.get("currency", "INR")
        
        total_inr = convert_to_inr(data.get("total", 0), currency)
        tax_inr = convert_to_inr(data.get("tax", 0), currency)
        subtotal_inr = convert_to_inr(data.get("subtotal", 0), currency)
        
        insights = generate_insights(data)
        
        existing_invoices = []
        if supabase:
            try:
                res = supabase.table("invoices").select("*").execute()
                existing_invoices = res.data
            except Exception as e:
                logger.error(f"Failed to fetch invoices for duplicate check: {e}")

        if not data.get("invoice_number") or str(data.get("invoice_number")).upper() == "UNKNOWN":
            data["invoice_number"] = str(uuid.uuid4())

        # Normalize fields before processing logic
        data["invoice_number"] = normalize_id(data.get("invoice_number"))
        data["vendor"] = normalize_text(data.get("vendor"))
        data["product"] = normalize_text(data.get("product"))

        print("NEW INVOICE NUMBER:", data.get("invoice_number"))
        print("CHECKING AGAINST:", [inv.get("invoice_number") for inv in existing_invoices])

        duplicate = is_duplicate(data, existing_invoices)
        data["is_duplicate"] = duplicate
        
        status = "Flagged" if any(f.get("type") == "warning" for f in insights) else "Paid"
        if duplicate:
            status = "Duplicate"

        response_data = {
            "id": str(uuid.uuid4()),
            "file_name": file.filename,
            "vendor": data["vendor"],
            "invoice_number": data.get("invoice_number", "UNKNOWN"),
            "date": data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
            
            "total": float(total_inr),
            "amount": float(total_inr), 
            "subtotal": float(subtotal_inr),
            "tax": float(tax_inr),
            
            "product": data.get("product", "Unknown Product"),
            "is_duplicate": duplicate,
            
            "original_total": float(data.get("total", 0) or 0),
            "currency": currency,
            "status": status,
            "category": data.get("category", "Uncategorized"),
            "extra_details": data.get("extra_details", {}),
            "findings": insights,
            "insights": insights,
            "created_at": datetime.utcnow().isoformat()
        }
        
        if supabase:
            try:
                supabase.table("invoices").insert(response_data).execute()
            except Exception as e:
                logger.error(f"Supabase insertion failed: {e}")
                
        return {
            "success": True,
            "parsed": response_data,
            **response_data
        }
    except Exception as e:
        print("❌ BACKEND ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/invoices")
def get_invoices():
    if supabase:
        try:
            res = supabase.table("invoices").select("*").order("created_at", desc=True).execute()
            return res.data
        except Exception as e:
            logger.error(f"Supabase fetch failed: {e}")
            return []
    return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
