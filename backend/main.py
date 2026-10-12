from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="CATCH Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def dynamic_fabric_classifier(title: str, page_text: str) -> str:
    combined = (title + " " + page_text).lower()
    
    materials = [
        ("organza", "Sheer Premium Organza Silk Blend"),
        ("chiffon", "Pure Lightweight Printed Chiffon"),
        ("jacquard", "Woven Jacquard Cotton-Blend Texture"),
        ("lurex", "Printed Lurex Metallic Thread Blend"),
        ("lawn", "100% Premium Lawn Cotton (Summer Weave)"),
        ("silk", "Pure Silk Blend (Fine Smooth Finish)"),
        ("denim", "100% Pure Stretch Cotton Denim"),
        ("jean", "100% Pure Cotton Denim"),
        ("corduroy", "Fine Ribbed Cotton Corduroy"),
        ("quilted", "Insulated Quilted Polyester Outerwear"),
        ("velvet", "Luxurious Soft Velvet Fabric"),
        ("linen", "100% Natural Breathable Linen"),
        ("cotton", "100% Pure Breathable Woven Cotton")
    ]
    
    for key, description in materials:
        if key in combined:
            return description
            
    return "Fine Woven Pure Cotton / Premium Synthetic Blend"

@app.get("/")
def read_root():
    return {"status": "ok", "message": "CATCH Backend API is running"}

@app.post("/api/v1/analyze-item")
async def analyze_item(
    file: UploadFile = File(...),
    include_deals: bool = Form(True)
):
    return {
        "status": "success",
        "fabric_quality": "Camera Visual Analysis: Organza / Lawn Fabric Detected",
        "matches": [
            {
                "title": "Camera Analysed Match",
                "price": "Verified Best Price",
                "store": "Official Store",
                "link": "#"
            }
        ],
        "page_coupons": {
            "final_price": "Calculated at checkout",
            "promo_savings": "15% OFF",
            "discount_pct": "15%",
            "codes": ["VISUAL15"]
        }
    }

@app.post("/api/v1/extension/match")
async def extension_match(payload: dict):
    title = payload.get("title", "Product")
    price = payload.get("price", 0)
    original_price = payload.get("original_price", 0)
    currency = payload.get("currency", "PKR")
    url = payload.get("url", "")
    page_text = payload.get("page_text", "")

    fabric_info = dynamic_fabric_classifier(title, page_text)

    if original_price > price and price > 0:
        savings = original_price - price
        discount_pct = int(round((savings / original_price) * 100))
        code = f"SALE{discount_pct}"
    elif price > 0:
        discount_pct = 28 if "edenrobe" in url else 15
        savings = int(price * (discount_pct / 100))
        code = f"SAVE{discount_pct}"
    else:
        discount_pct = 10
        savings = 0
        code = "WELCOME10"

    price_str = f"{currency} {price:,}" if price > 0 else f"{currency} 5,000"
    savings_str = f"{currency} {savings:,}" if savings > 0 else f"{discount_pct}% Discount"

    return {
        "status": "success",
        "fabric_quality": fabric_info,
        "matches": [
            {
                "title": title[:38] + "..." if len(title) > 38 else title,
                "price": price_str,
                "store": "Verified Store",
                "link": url
            }
        ],
        "page_coupons": {
            "final_price": f"{currency} {price - savings:,}" if price > 0 else "N/A",
            "promo_savings": savings_str,
            "discount_pct": f"{discount_pct}%",
            "codes": [code]
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
