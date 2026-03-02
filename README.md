# TrustLend

TrustLend is an AI-powered loan document analyzer that helps users detect hidden charges, risky clauses, and unfair terms before they sign.

## Features
- **OCR Engine**: Extracts text from scanned PDFs and images.
- **AI Analysis**: Uses Gemini 1.5 Flash to analyze legal terms.
- **Fairness Score**: Calculates a 0-100 fairness score based on interest rates and risks.
- **Dark Mode**: Fully accessible dark mode support.

## Project Structure
- `trustlend-backend/`: Flask API with OCR and LLM services.
- `trustlend-frontend/`: React + Vite frontend.

## Prerequisites
- Python 3.8+
- Node.js 16+
- Tesseract OCR (installed and in PATH, or configured in .env)
- Poppler (for PDF support, installed and in PATH)
- Google Gemini API Key

## Setup & Run

### Backend
1. Navigate to `trustlend-backend`:
   ```bash
   cd trustlend-backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure `.env`:
   - Add your `GEMINI_API_KEY`.
   - Update `TESSERACT_CMD` if necessary.
4. Run server:
   ```bash
   python run.py
   ```
   Server runs at `http://localhost:5000`.

### Frontend
1. Navigate to `trustlend-frontend`:
   ```bash
   cd trustlend-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:5173`.

## Deliverables
- [x] Backend API (Flask)
- [x] OCR & LLM Integration
- [x] Fairness Scoring Logic
- [x] Frontend UI (React)
- [x] Full Integration

## License
MIT
