import pandas as pd
from pypfopt import expected_returns, risk_models
from pypfopt.efficient_frontier import EfficientFrontier

def calculate_mvo(prices_dict: dict):
    df = pd.DataFrame(prices_dict)
    
    if len(df) < 5:
        raise ValueError("Data harga minimal harus memiliki 5 titik waktu.")

    mu = expected_returns.mean_historical_return(df)
    S = risk_models.sample_cov(df)

    ef = EfficientFrontier(mu, S, weight_bounds=(0, 1))
    ef.max_sharpe()
    
    cleaned_weights = ef.clean_weights()
    exp_return, volatility, sharpe = ef.portfolio_performance()

    return {
        "weights": cleaned_weights,
        "metrics": {
            "expected_return": round(exp_return, 4),
            "volatility": round(volatility, 4),
            "sharpe_ratio": round(sharpe, 4)
        }
    }