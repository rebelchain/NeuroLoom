from fastapi import FastAPI, HTTPException
from schemas.portfolio import PricePayload
from services.mvo_optimizer import calculate_mvo

app = FastAPI(title="NeuroLoom Quant Engine")

@app.post("/api/optimize")
def optimize_endpoint(payload: PricePayload):
    try:
        result = calculate_mvo(payload.prices)
        
        return {  
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))