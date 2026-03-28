"""AI Advisor — contextual investment advice for DSE investors.

Uses Ollama (local LLM) when available, falls back to an expanded rule-based knowledge base.
"""

import logging
import httpx

from app.core.config import settings
from app.core import dse_data

logger = logging.getLogger("dse.ai_advisor")


# ---------------------------------------------------------------------------
# Market context builder
# ---------------------------------------------------------------------------

def _build_market_context() -> str:
    lines = ["Current DSE Stock Universe:"]
    for sym, info in list(dse_data.DSE_STOCKS.items())[:15]:
        lines.append(
            f"- {sym} ({info['name']}): Sector={info['sector']}, "
            f"Return={info['expected_return']:.1%}, "
            f"Vol={info['volatility']:.1%}, "
            f"DivYield={info['dividend_yield']:.1%}"
        )
    lines.append(f"Total: {len(dse_data.DSE_STOCKS)} listed securities")
    return "\n".join(lines)


def _build_portfolio_context(portfolio_context: dict | None) -> str:
    if not portfolio_context:
        return "No portfolio context provided."
    lines = ["User's Portfolio:"]
    for key, val in portfolio_context.items():
        lines.append(f"- {key}: {val}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Ollama LLM integration
# ---------------------------------------------------------------------------

def _ask_ollama(question: str, portfolio_context: dict | None = None) -> str | None:
    """Call Ollama's local LLM API. Returns response text or None on failure."""
    if not settings.OLLAMA_BASE_URL:
        return None

    system_prompt = f"""You are a professional DSE (Dar es Salaam Stock Exchange) investment advisor.
You give clear, practical advice to Tanzanian retail investors. Be specific about DSE stocks.
Keep responses concise (3-5 paragraphs max). Use TZS for currency.

{_build_market_context()}

{_build_portfolio_context(portfolio_context)}

Important rules:
- Never guarantee returns. Always mention that past performance doesn't guarantee future results.
- Mention the 5% dividend withholding tax when discussing dividends.
- Recommend diversification across sectors.
- For beginners, always mention the need for a CDS account and licensed broker.
- Reference the DSE trading hours: Mon-Fri, 10:00 AM - 2:00 PM EAT."""

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": question,
                    "system": system_prompt,
                    "stream": False,
                },
            )
            resp.raise_for_status()
            return resp.json().get("response", "").strip()
    except Exception as e:
        logger.warning("Ollama call failed: %s", e)
        return None


# ---------------------------------------------------------------------------
# Expanded knowledge base (20+ topics)
# ---------------------------------------------------------------------------

_KNOWLEDGE_BASE = {
    "invest more": (
        "Whether to invest more depends on your financial situation:\n"
        "1. **Emergency fund**: Ensure you have 3-6 months of expenses saved first.\n"
        "2. **Debt**: Pay off high-interest debt before investing more.\n"
        "3. **Consistency**: Regular monthly contributions beat large one-time investments due to cost averaging.\n"
        "4. **DSE**: Timing matters less than time *in* the market.\n\n"
        "**Tip**: Use the Investment Simulator to model increased contributions."
    ),
    "portfolio drop": (
        "Portfolio drops are normal:\n"
        "1. **Don't panic sell**: The DSE has recovered from every downturn historically.\n"
        "2. **Check your horizon**: If investing for 5+ years, short-term drops don't matter.\n"
        "3. **Review allocation**: If the drop makes you anxious, your risk may be set too high.\n"
        "4. **Opportunity**: Dips can be buying opportunities.\n\n"
        "Check the Alerts page for rebalancing recommendations."
    ),
    "dividend": (
        "DSE dividends:\n"
        "- Companies typically pay 1-2 times per year, usually June and December.\n"
        "- Top payers: NMB (~8%), NIC Insurance (~9%), Government Bonds (~11%).\n"
        "- A **5% withholding tax** is automatically deducted from all dividends.\n"
        "- Reinvesting dividends boosts long-term returns through compounding.\n"
        "- Dividend yields shown in the app are computed from actual DSE data."
    ),
    "rebalance": (
        "Rebalancing keeps your portfolio aligned with your target allocation:\n"
        "- Winning stocks grow and become overweight over time.\n"
        "- Rebalancing means selling overweight positions and buying underweight ones.\n"
        "- We check drift daily using **real DSE prices** and alert you when any holding moves >5% from target.\n"
        "- Quarterly rebalancing is generally sufficient."
    ),
    "risk": (
        "Understanding risk profiles:\n"
        "- **Conservative**: Max 65% stocks, min 15% bonds. Short horizons or low risk appetite.\n"
        "- **Moderate**: Max 85% stocks, min 10% bonds. Balanced for most investors.\n"
        "- **Aggressive**: Up to 100% stocks. Long horizons and high tolerance.\n\n"
        "Your profile also considers your investment horizon and goal — a 20-year horizon allows more equity than a 3-year one, even with the same risk label."
    ),
    "start": (
        "Getting started with DSE investing:\n"
        "1. Complete your profile on the Onboarding page.\n"
        "2. Use the Advisor to generate an optimized portfolio.\n"
        "3. Open a **CDS account** (Central Depository System) — required for trading.\n"
        "4. Choose a licensed broker from our Brokers page.\n"
        "5. Start small — you can begin with as little as TZS 500,000.\n"
        "6. Set up regular monthly contributions for best results."
    ),
    "nmb": (
        "**NMB Bank (NMB)** is one of Tanzania's largest banks:\n"
        "- Listed on the DSE, major component of the equity market.\n"
        "- Known for consistent dividend payments (~8% yield).\n"
        "- Exposure to Tanzania's growing banking sector.\n"
        "- Highly correlated with CRDB (both are banking stocks), so diversify across sectors."
    ),
    "crdb": (
        "**CRDB Bank (CRDB)** is Tanzania's largest commercial bank:\n"
        "- Strong expected returns (~12%) with moderate volatility.\n"
        "- Regular dividend payments.\n"
        "- Consider pairing with non-banking stocks (TBL, VODA) for diversification."
    ),
    "bond": (
        "**Government Bonds (GOVB)** on the DSE:\n"
        "- Offer ~11% yield with only ~2% volatility — excellent risk-adjusted returns.\n"
        "- Near-zero correlation with equities — the best diversifier.\n"
        "- The optimizer often allocates 15-30% to bonds for stability.\n"
        "- Suitable for conservative investors or as a portfolio anchor."
    ),
    "tax": (
        "DSE investment taxes in Tanzania:\n"
        "- **Dividend tax**: 5% withholding tax on all dividends (deducted automatically).\n"
        "- **Capital gains**: Currently 0% on DSE-listed securities for individual investors.\n"
        "- **No stamp duty** on DSE transactions.\n"
        "- Keep records of your transactions for tax filing purposes."
    ),
    "broker": (
        "Choosing a DSE broker:\n"
        "- You need a licensed broker to buy/sell DSE stocks.\n"
        "- Visit our Brokers page for a list of CMSA-licensed brokers.\n"
        "- Compare commission rates (typically 1-2% per transaction).\n"
        "- Ensure they offer online/mobile trading for convenience.\n"
        "- You'll also need a CDS account — your broker can help set this up."
    ),
    "cds": (
        "The **Central Depository System (CDS)** account:\n"
        "- Required to hold and trade DSE securities.\n"
        "- Opened through your broker or directly at the DSE.\n"
        "- Needed for: buying stocks, receiving dividends, corporate actions.\n"
        "- Documents needed: National ID, TIN number, bank account details."
    ),
    "sector": (
        "DSE sector overview:\n"
        "- **Banking**: NMB, CRDB, DCB, KCB, MCB, MKCB — largest sector by market cap.\n"
        "- **Consumer**: TBL, TCC, EABL — defensive, steady dividends.\n"
        "- **Telecom**: VODA — growing mobile penetration.\n"
        "- **Manufacturing**: TPCC, TCCL, TOL — industrial exposure.\n"
        "- **Insurance**: NICO — diversification play.\n"
        "- **ETFs**: IEACLC-ETF, VERTEX-ETF — diversified baskets.\n\n"
        "The optimizer automatically diversifies across sectors."
    ),
    "sharpe": (
        "The **Sharpe Ratio** measures risk-adjusted returns:\n"
        "- Formula: (Portfolio Return - Risk-Free Rate) / Portfolio Volatility\n"
        "- Higher is better. A Sharpe > 0.5 is decent, > 1.0 is excellent.\n"
        "- Tanzania's risk-free rate is ~8% (T-bill rate), so DSE stocks need to beat that.\n"
        "- The optimizer maximizes the Sharpe ratio — it finds the best return per unit of risk."
    ),
    "volatility": (
        "**Volatility** measures how much prices fluctuate:\n"
        "- Low volatility (2-6%): Government bonds, stable stocks like TBL.\n"
        "- Moderate (7-10%): Banking stocks like NMB, CRDB.\n"
        "- High (10%+): Growth stocks like SWIS, smaller companies.\n"
        "- Higher volatility = higher risk but potentially higher returns.\n"
        "- The optimizer balances volatility against expected returns."
    ),
    "market hours": (
        "DSE trading hours:\n"
        "- **Pre-open**: 9:30 AM - 10:00 AM EAT\n"
        "- **Continuous trading**: 10:00 AM - 2:00 PM EAT\n"
        "- **Days**: Monday to Friday (excluding public holidays)\n"
        "- Our market data syncs daily after market close at 5:00 PM EAT."
    ),
    "etf": (
        "**ETFs on the DSE**:\n"
        "- **IEACLC-ETF**: iTrust East Africa Large Cap ETF — diversified across EA blue chips.\n"
        "- **VERTEX-ETF**: Another diversified basket.\n"
        "- ETFs provide instant diversification in a single purchase.\n"
        "- Lower risk than individual stocks, suitable for beginners."
    ),
    "simulator": (
        "The **Investment Simulator** helps you plan:\n"
        "- Enter your initial investment, monthly contribution, and time horizon.\n"
        "- See projected portfolio growth using Monte Carlo simulation.\n"
        "- Compare conservative vs. aggressive strategies.\n"
        "- Navigate to the Simulator page from the sidebar."
    ),
    "how does it work": (
        "How the DSE Robo-Advisor works:\n"
        "1. **Profile**: You tell us your income, capital, risk tolerance, horizon, and goal.\n"
        "2. **Optimization**: Our AI uses Modern Portfolio Theory (MPT) to find the mathematically optimal stock mix.\n"
        "3. **Market data**: We scrape real DSE prices daily from the official API.\n"
        "4. **Constraints**: Your profile determines limits — conservative gets more bonds, aggressive gets more equity.\n"
        "5. **Regime awareness**: The engine detects bull/bear markets and adjusts accordingly.\n"
        "6. **Monitoring**: We check for portfolio drift daily and alert you when rebalancing is needed."
    ),
}


# ---------------------------------------------------------------------------
# Main advisor function
# ---------------------------------------------------------------------------

def get_ai_response(question: str, portfolio_context: dict | None = None) -> dict:
    """Generate a contextual response to an investment question."""

    # Try Ollama first (if configured)
    ollama_response = _ask_ollama(question, portfolio_context)
    if ollama_response:
        return {
            "answer": ollama_response,
            "source": "ai",
            "related_pages": _infer_related_pages(question),
        }

    # Fall back to expanded knowledge base
    question_lower = question.lower()

    for keyword, response in _KNOWLEDGE_BASE.items():
        if keyword in question_lower:
            return {
                "answer": response,
                "source": "knowledge_base",
                "related_pages": _get_related_pages(keyword),
            }

    # Default
    topics = list(_KNOWLEDGE_BASE.keys())[:10]
    topic_list = "\n".join(f"- \"{t}\"" for t in topics)
    return {
        "answer": (
            f"I can help with many DSE investment topics. Try asking about:\n{topic_list}\n"
            f"... and {len(_KNOWLEDGE_BASE) - 10} more topics.\n\n"
            "Or ask any specific question about DSE stocks, portfolio strategy, or investing in Tanzania."
        ),
        "source": "default",
        "related_pages": ["/learn", "/advisor", "/simulator"],
    }


def _get_related_pages(keyword: str) -> list[str]:
    pages = {
        "invest more": ["/simulator", "/advisor"],
        "portfolio drop": ["/alerts", "/analytics"],
        "dividend": ["/analytics", "/learn"],
        "rebalance": ["/alerts", "/analytics"],
        "risk": ["/onboarding", "/advisor"],
        "start": ["/onboarding", "/advisor", "/brokers"],
        "nmb": ["/market", "/stocks"],
        "crdb": ["/market", "/stocks"],
        "bond": ["/advisor", "/stocks"],
        "tax": ["/learn"],
        "broker": ["/brokers"],
        "cds": ["/brokers", "/learn"],
        "sector": ["/stocks", "/market"],
        "sharpe": ["/analytics", "/learn"],
        "volatility": ["/analytics", "/learn"],
        "market hours": ["/market"],
        "etf": ["/stocks", "/market"],
        "simulator": ["/simulator"],
        "how does it work": ["/advisor", "/learn"],
    }
    return pages.get(keyword, ["/learn"])


def _infer_related_pages(question: str) -> list[str]:
    """Infer related pages from question content for LLM responses."""
    q = question.lower()
    pages = []
    if any(w in q for w in ["portfolio", "allocat", "optimiz"]):
        pages.append("/advisor")
    if any(w in q for w in ["market", "price", "stock", "ticker"]):
        pages.append("/market")
    if any(w in q for w in ["dividend", "return", "performance"]):
        pages.append("/analytics")
    if any(w in q for w in ["risk", "profile", "conservative", "aggressive"]):
        pages.append("/onboarding")
    if any(w in q for w in ["broker", "cds", "account"]):
        pages.append("/brokers")
    return pages or ["/learn"]
