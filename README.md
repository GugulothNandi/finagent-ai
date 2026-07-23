# 🚀 Multi-Agent Financial Research Platform

An AI-powered financial research platform that uses multiple specialized AI agents to analyze companies, financial statements, market trends, news, and risks to generate professional investment research reports.

## 📖 Overview

The **Multi-Agent Financial Research Platform** automates the work of financial analysts by orchestrating multiple AI agents. Instead of manually reading annual reports, financial statements, market research, and news articles, users can simply ask a question such as:

> **"Should Tesla invest in India?"**

The platform gathers information from multiple sources, analyzes it using specialized AI agents, and generates a comprehensive investment report with supporting evidence.

---

# ✨ Features

* 🤖 Multi-Agent AI Architecture
* 📈 Financial Statement Analysis
* 📰 Real-Time News Analysis
* 📄 SEC Filing Analysis using RAG
* 🌍 Market Research
* ⚠️ Risk Assessment
* 📊 SWOT Analysis
* 📑 Professional PDF Report Generation
* 🔐 JWT Authentication
* 👤 User Login & Registration
* 📚 Chat History
* 📈 Interactive Dashboard

---

# 🏗️ System Architecture

```text
                    User
                      │
                      ▼
              React Frontend
                      │
                      ▼
               FastAPI Backend
                      │
                      ▼
             Orchestrator Agent
                      │
      ┌─────────┬──────────┬──────────┬──────────┬─────────┐
      ▼         ▼          ▼          ▼          ▼
 Research     News     Financial    Market      Risk
  Agent       Agent      Agent      Agent      Agent
      │
      ▼
 SEC Filing Agent (RAG)
      │
      ▼
 Report Generator
      │
      ▼
 Professional PDF Report
```

---

# 🧠 AI Agents

## 1. Research Agent

Responsible for collecting company information.

**Responsibilities**

* Company overview
* CEO
* Products
* Business model
* Competitors
* Headquarters

---

## 2. News Agent

Analyzes recent news related to the company.

**Responsibilities**

* Business News
* Government Policies
* Market Events
* Industry Trends

---

## 3. Financial Agent

Analyzes company financial health.

**Responsibilities**

* Revenue
* Profit
* Cash Flow
* Debt
* EPS
* P/E Ratio
* Profit Margin

---

## 4. SEC Filing Agent

Uses Retrieval-Augmented Generation (RAG) to answer questions from annual reports.

**Responsibilities**

* Download SEC filings
* Chunk documents
* Generate embeddings
* Store vectors
* Retrieve relevant content
* Answer document-based questions

---

## 5. Market Agent

Analyzes the target market.

**Responsibilities**

* Market Size
* CAGR
* Customer Demand
* Government Policies
* Competitor Analysis

---

## 6. Risk Agent

Identifies potential business risks.

**Responsibilities**

* Political Risk
* Economic Risk
* Supply Chain Risk
* Regulatory Risk
* Currency Risk

---

## 7. Report Generator

Combines outputs from all AI agents into a professional report.

The report includes:

* Executive Summary
* Company Overview
* Financial Analysis
* Market Analysis
* News Summary
* Risk Assessment
* SWOT Analysis
* Final Recommendation
* References
* Charts

---

# 💻 Tech Stack

## Frontend

* React.js
* Next.js
* Tailwind CSS
* TypeScript

## Backend

* Python
* FastAPI

## AI

* OpenAI GPT
* LangChain
* LangGraph

## Database

* PostgreSQL

## Vector Database

* Qdrant

## Authentication

* JWT
* bcrypt

## Background Processing

* Redis
* Celery

## Deployment

* Docker
* GitHub Actions
* AWS

---

# 📁 Project Structure

```text
financial-research-platform/

├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── assets/
│
├── backend/
│   ├── agents/
│   │   ├── research_agent.py
│   │   ├── news_agent.py
│   │   ├── financial_agent.py
│   │   ├── market_agent.py
│   │   ├── risk_agent.py
│   │   ├── sec_agent.py
│   │   └── report_generator.py
│   │
│   ├── api/
│   ├── database/
│   ├── models/
│   ├── services/
│   ├── vector_db/
│   ├── reports/
│   └── main.py
│
├── docker-compose.yml
├── README.md
└── requirements.txt
```

---

# 🚀 Workflow

1. User enters a financial research question.
2. The Orchestrator receives the request.
3. Specialized AI agents collect and analyze data.
4. Results are combined.
5. A professional investment report is generated.
6. The user views the report and downloads it as a PDF.

---

# 🔐 Authentication

* User Registration
* Secure Login
* JWT Access Tokens
* Password Hashing using bcrypt

---

# 📊 Example Query

```
Should Tesla invest in India?
```

The platform analyzes:

* Tesla's financial health
* Recent company news
* Indian EV market
* Government policies
* Competition
* Potential risks

Finally, it generates a professional recommendation report.

---

# 🎯 Future Improvements

* Voice-based research assistant
* Live stock market integration
* Multi-language support
* AI presentation generation
* Portfolio management
* Investment comparison dashboard
* Email report delivery
* Mobile application

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes.
4. Push the branch.
5. Open a Pull Request.

---

# 📜 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Nandhi Vardhan**

B.Tech, Chemical Engineering
Indian Institute of Technology Kharagpur

---

⭐ If you found this project useful, consider giving it a **Star** on GitHub!
