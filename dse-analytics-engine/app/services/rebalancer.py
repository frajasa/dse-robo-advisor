from app.core import dse_data


def check_rebalancing(
    holdings: list[dict],
    drift_threshold: float = 5.0,
) -> dict:
    """Check if a portfolio needs rebalancing based on allocation drift.

    holdings: list of {"symbol": str, "target_allocation": float, "current_allocation": float}
    drift_threshold: percentage drift that triggers a rebalancing alert
    """
    alerts = []
    needs_rebalancing = False
    max_drift = 0.0

    for holding in holdings:
        symbol = holding["symbol"]
        target = holding["target_allocation"]
        current = holding.get("current_allocation", target)
        drift = abs(current - target)

        if drift > max_drift:
            max_drift = drift

        if drift > drift_threshold:
            needs_rebalancing = True
            action = "SELL" if current > target else "BUY"
            severity = "HIGH" if drift > 10.0 else "MEDIUM"

            stock_name = dse_data.DSE_STOCKS.get(symbol, {}).get("name", symbol)
            alerts.append({
                "symbol": symbol,
                "name": stock_name,
                "target_allocation": target,
                "current_allocation": round(current, 2),
                "drift": round(drift, 2),
                "action": action,
                "severity": severity,
                "recommendation": f"{action} {stock_name} to bring allocation from {current:.1f}% back to {target:.1f}%",
            })

    return {
        "needs_rebalancing": needs_rebalancing,
        "max_drift": round(max_drift, 2),
        "drift_threshold": drift_threshold,
        "alerts": sorted(alerts, key=lambda a: a["drift"], reverse=True),
    }
