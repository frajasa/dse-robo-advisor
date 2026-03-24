"""AI Advisor service — generates contextual investment advice.

Uses portfolio context and DSE market data to provide personalized answers.
Designed to work with or without an external LLM API.
"""

from app.core import dse_data


def _build_market_context() -> str:
    """Build a summary of current DSE market data for AI context."""
    lines = ["Current DSE Stock Universe:"]
    for sym, info in dse_data.DSE_STOCKS.items():
        lines.append(
            f"- {sym} ({info['name']}): Sector={info['sector']}, "
            f"ExpReturn={info['expected_return']:.1%}, "
            f"Vol={info['volatility']:.1%}, "
            f"DivYield={info['dividend_yield']:.1%}"
        )
    return "\n".join(lines)


# Rule-based responses for common questions (no LLM needed)
_KNOWLEDGE_BASE = {
    "invest more": (
        "Whether to invest more depends on your financial situation:\n"
        "1. **Emergency fund**: Ensure you have 3-6 months of expenses saved first.\n"
        "2. **Debt**: Pay off high-interest debt before investing more.\n"
        "3. **Consistency**: Regular monthly contributions (even small ones) beat large one-time investments due to cost averaging.\n"
        "4. **Market conditions**: On the DSE, timing matters less than time *in* the market. If you have spare capital, investing sooner is generally better.\n\n"
        "**Tip**: Try the Investment Simulator to see how increasing your monthly contribution would affect your returns."
    ),
    "portfolio drop": (
        "Portfolio drops are normal and expected. Here's what to consider:\n"
        "1. **Don't panic sell**: Short-term drops are normal. The DSE has recovered from every downturn historically.\n"
        "2. **Check your time horizon**: If you're investing for 5+ years, short-term drops don't matter much.\n"
        "3. **Review your allocation**: If the drop is making you very anxious, your risk tolerance might be set too high. Consider switching to a more conservative profile.\n"
        "4. **Look for opportunities**: Market dips can be good buying opportunities if your financial situation allows.\n\n"
        "**Tip**: Check the Alerts page to see if rebalancing is recommended."
    ),
    "dividend": (
        "Dividends on the DSE:\n"
        "- DSE companies typically pay dividends 1-2 times per year, usually in June and December.\n"
        "- Top dividend payers include NMB Bank (~8% yield), NIC Insurance (~9%), and Government Bonds (~11%).\n"
        "- A 5% withholding tax is automatically deducted.\n"
        "- Reinvesting dividends can dramatically boost your long-term returns through compounding.\n\n"
        "Check your Analytics page for projected dividend income."
    ),
    "rebalance": (
        "Rebalancing keeps your portfolio aligned with your intended risk level:\n"
        "- Over time, winning stocks grow and become overweight in your portfolio.\n"
        "- Rebalancing means selling some overweight positions and buying underweight ones.\n"
        "- We check for drift daily and alert you when any holding moves more than 5% from target.\n"
        "- Quarterly rebalancing is generally sufficient — don't over-trade.\n\n"
        "Visit the Alerts page to check your current portfolio drift."
    ),
    "risk": (
        "Understanding your risk profile:\n"
        "- **Conservative**: Max 65% stocks, minimum 15% bonds. Best for short horizons or low risk appetite.\n"
        "- **Moderate**: Max 85% stocks, minimum 10% bonds. Balanced approach for most investors.\n"
        "- **Aggressive**: Up to 100% stocks. Best for long horizons and high risk tolerance.\n\n"
        "Your risk tolerance should reflect both your *ability* (financial situation) and *willingness* (emotional comfort) to take risk.\n\n"
        "You can retake the risk assessment on the Onboarding page."
    ),
    "start": (
        "Getting started with DSE investing:\n"
        "1. **Complete your profile**: Go to the Onboarding page and answer the risk questionnaire.\n"
        "2. **Generate a portfolio**: Use the Advisor to create an optimized portfolio.\n"
        "3. **Open a CDS account**: You need a Central Depository System account to trade.\n"
        "4. **Choose a broker**: Visit our Brokers page to find a licensed DSE broker.\n"
        "5. **Start small**: You can begin with as little as TZS 500,000.\n"
        "6. **Be consistent**: Set up regular monthly contributions for the best results."
    ),
}


def get_ai_response(question: str, portfolio_context: dict | None = None) -> dict:
    """Generate a contextual response to an investment question."""
    question_lower = question.lower()

    # Check knowledge base for matching topics
    for keyword, response in _KNOWLEDGE_BASE.items():
        if keyword in question_lower:
            return {
                "answer": response,
                "source": "knowledge_base",
                "related_pages": _get_related_pages(keyword),
            }

    # Default helpful response
    return {
        "answer": (
            "I can help you with questions about:\n"
            "- **Investing more**: \"Should I invest more this month?\"\n"
            "- **Portfolio drops**: \"Why did my portfolio drop?\"\n"
            "- **Dividends**: \"How do dividends work on the DSE?\"\n"
            "- **Rebalancing**: \"When should I rebalance?\"\n"
            "- **Risk**: \"What does my risk profile mean?\"\n"
            "- **Getting started**: \"How do I start investing?\"\n\n"
            "Try asking one of these questions, or visit the Learn page for detailed educational content."
        ),
        "source": "default",
        "related_pages": ["/learn", "/advisor", "/simulator"],
    }


def _get_related_pages(keyword: str) -> list[str]:
    """Get related page links based on topic."""
    pages = {
        "invest more": ["/simulator", "/advisor"],
        "portfolio drop": ["/alerts", "/analytics"],
        "dividend": ["/analytics", "/learn"],
        "rebalance": ["/alerts", "/analytics"],
        "risk": ["/onboarding", "/advisor"],
        "start": ["/onboarding", "/advisor", "/brokers"],
    }
    return pages.get(keyword, ["/learn"])
