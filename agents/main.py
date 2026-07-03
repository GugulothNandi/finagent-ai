from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import yfinance as yf
from newsapi import NewsApiClient
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
newsapi = NewsApiClient(api_key=os.getenv("NEWS_API_KEY"))


class QueryRequest(BaseModel):
    query: str


def call_groq(prompt: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000,
    )
    return response.choices[0].message.content


async def call_groq_async(prompt: str) -> str:
    """Run the blocking Groq call in a worker thread so several calls can run at once."""
    return await asyncio.to_thread(call_groq, prompt)


def fmt_num(value):
    if isinstance(value, (int, float)):
        return f"${value:,}"
    return "N/A"


def fetch_real_financials(ticker: str):
    """Blocking I/O call to yfinance. Meant to be run via asyncio.to_thread."""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        if not info or info.get("currentPrice") is None:
            return None, f"Real financial data unavailable for ticker {ticker}."
        text = f"""
        Real Stock Data for {ticker}:
        - Current Price: ${info.get('currentPrice', 'N/A')}
        - Revenue: {fmt_num(info.get('totalRevenue'))}
        - Net Profit: {fmt_num(info.get('netIncomeToCommon'))}
        - P/E Ratio: {info.get('trailingPE', 'N/A')}
        - Market Cap: {fmt_num(info.get('marketCap'))}
        - 52 Week High: ${info.get('fiftyTwoWeekHigh', 'N/A')}
        - 52 Week Low: ${info.get('fiftyTwoWeekLow', 'N/A')}
        - Analyst Recommendation: {info.get('recommendationKey', 'N/A')}
        """
        return info, text
    except Exception:
        return None, "Real financial data unavailable for this query."


def fetch_real_news(company: str):
    """Blocking I/O call to NewsAPI. Meant to be run via asyncio.to_thread."""
    try:
        articles = newsapi.get_everything(
            q=company, language="en", sort_by="relevancy", page_size=10
        )
        filtered = [
            a
            for a in articles["articles"]
            if company.lower() in a["title"].lower()
            or company.lower() in (a["description"] or "").lower()
        ]
        final_articles = filtered[:5] if filtered else articles["articles"][:3]
        headlines = [a["title"] + " — " + a["source"]["name"] for a in final_articles]
        news_text = (
            "Recent News Headlines:\n" + "\n".join(headlines)
            if headlines
            else "No recent relevant headlines found."
        )
        return headlines, news_text
    except Exception:
        return [], "Real news unavailable for this query."


@app.post("/report")
async def generate_report(req: QueryRequest):
    # Step 1 — extract ticker + company name concurrently (cheap, fast LLM calls)
    ticker_raw, company_raw = await asyncio.gather(
        call_groq_async(
            f"Extract only the stock ticker symbol from this query, reply with just "
            f"the ticker like TSLA or AAPL, nothing else: {req.query}"
        ),
        call_groq_async(
            f"Extract just the company name from this query, reply with only the "
            f"name, nothing else: {req.query}"
        ),
    )
    ticker = ticker_raw.strip().upper()
    company = company_raw.strip()

    # Step 2 — fetch real financials + real news concurrently (blocking I/O in threads)
    (info, real_financials), (headlines, real_news_text) = await asyncio.gather(
        asyncio.to_thread(fetch_real_financials, ticker),
        asyncio.to_thread(fetch_real_news, company),
    )

    # Step 3 — run the 5 specialist agents concurrently, each grounded in real data
    research_prompt = (
        f"Company research analyst. Give a concise overview of {company} in the "
        f"context of this question: {req.query}"
    )
    financial_prompt = (
        f"Financial analyst. Using this real data:\n{real_financials}\n"
        f"Analyze revenue, profit, margins, and valuation for {company}."
    )
    market_prompt = (
        f"Market analyst. Analyze market size, growth trends, and competitive "
        f"position for {company} regarding: {req.query}"
    )
    risk_prompt = (
        f"Risk analyst. Using this real data:\n{real_financials}\n"
        f"Identify and rate (High/Medium/Low) the key risks for {company}."
    )
    news_prompt = (
        f"Financial news analyst. Using these real headlines:\n{real_news_text}\n"
        f"Summarize sentiment as Positive and Negative points for {company}."
    )

    research_out, financial_out, market_out, risk_out, news_out = await asyncio.gather(
        call_groq_async(research_prompt),
        call_groq_async(financial_prompt),
        call_groq_async(market_prompt),
        call_groq_async(risk_prompt),
        call_groq_async(news_prompt),
    )

    # Step 4 — synthesize all 5 agent outputs into one cohesive report
    synthesis_prompt = f"""You are a senior investment analyst at Goldman Sachs.
Combine the following specialist analyst notes into ONE polished, cohesive research
report answering: {req.query}

Company Overview (Research Agent):
{research_out}

Financial Analysis (Financial Agent):
{financial_out}

Market Analysis (Market Agent):
{market_out}

Risk Assessment (Risk Agent):
{risk_out}

News Sentiment (News Agent):
{news_out}

Real financial data to reference directly:
{real_financials}

Structure the final report with:
1. Executive Summary
2. Company Overview
3. Financial Analysis (cite the real numbers)
4. Market Opportunity
5. Risk Assessment
6. SWOT Analysis
7. Final Recommendation (Buy/Hold/Avoid with clear reasoning based on real data)
"""
    report = await call_groq_async(synthesis_prompt)

    return {
        "report": report,
        "sections": {
            "research": research_out,
            "financial": financial_out,
            "market": market_out,
            "risk": risk_out,
            "news": news_out,
        },
        "realData": {"financials": real_financials, "news": headlines},
    }


# ---------- Individual agent endpoints (kept for standalone/manual testing) ----------

@app.post("/research")
async def research_agent(req: QueryRequest):
    return {"result": await call_groq_async(f"Company research analyst. Give overview of: {req.query}")}


@app.post("/news")
async def news_agent(req: QueryRequest):
    return {"result": await call_groq_async(f"Financial news analyst. Summarize positive and negative news about: {req.query}")}


@app.post("/financial")
async def financial_agent(req: QueryRequest):
    return {"result": await call_groq_async(f"Financial analyst. Analyze revenue, profit, debt, margins for: {req.query}")}


@app.post("/market")
async def market_agent(req: QueryRequest):
    return {"result": await call_groq_async(f"Market analyst. Analyze market size, growth, policies for: {req.query}")}


@app.post("/risk")
async def risk_agent(req: QueryRequest):
    return {"result": await call_groq_async(f"Risk analyst. Identify and rate risks for: {req.query}")}


@app.post("/realfinancials")
async def real_financials_endpoint(req: QueryRequest):
    ticker_raw = await call_groq_async(
        f"Extract only the stock ticker symbol from this query, reply with just the ticker like TSLA or AAPL: {req.query}"
    )
    ticker = ticker_raw.strip().upper()
    info, _ = await asyncio.to_thread(fetch_real_financials, ticker)

    if not info:
        return {"ticker": ticker, "error": "No data found for this ticker"}

    return {
        "ticker": ticker,
        "price": info.get("currentPrice"),
        "revenue": info.get("totalRevenue"),
        "profit": info.get("netIncomeToCommon"),
        "pe_ratio": info.get("trailingPE"),
        "market_cap": info.get("marketCap"),
        "52week_high": info.get("fiftyTwoWeekHigh"),
        "52week_low": info.get("fiftyTwoWeekLow"),
        "recommendation": info.get("recommendationKey"),
    }


@app.post("/realnews")
async def real_news_endpoint(req: QueryRequest):
    company_raw = await call_groq_async(
        f"Extract just the company name from this query, reply with only the company name, nothing else: {req.query}"
    )
    company = company_raw.strip()
    headlines, _ = await asyncio.to_thread(fetch_real_news, company)

    if not headlines:
        summary = (
            f"No recent specific news found for {company}. Based on industry trends, "
            f"{company} is operating in a competitive market environment."
        )
        return {"company": company, "headlines": [], "summary": summary}

    summary = await call_groq_async(
        f"You are a financial news analyst covering {company}.\n"
        f"Analyze ONLY these headlines about {company} and summarize as Positive and Negative points.\n"
        f"Headlines:\n" + "\n".join(headlines)
    )

    return {"company": company, "headlines": headlines, "summary": summary}


@app.post("/stockhistory")
async def stock_history(req: QueryRequest):
    try:
        ticker_raw = await call_groq_async(
            f"Extract only the stock ticker symbol, reply with just the ticker like TSLA or AAPL, nothing else: {req.query}"
        )
        ticker = ticker_raw.strip().upper()

        def _fetch_history():
            stock = yf.Ticker(ticker)
            history = stock.history(period="1y")
            return [
                {
                    "date": str(index.date()),
                    "price": round(row["Close"], 2),
                    "volume": int(row["Volume"]),
                }
                for index, row in history.iterrows()
            ]

        data = await asyncio.to_thread(_fetch_history)
        return {"ticker": ticker, "data": data}
    except Exception as e:
        return {"ticker": "N/A", "data": [], "error": str(e)}