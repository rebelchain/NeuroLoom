from pydantic import BaseModel
from typing import Dict, List

class PricePayload(BaseModel):
    prices: Dict[str, List[float]]