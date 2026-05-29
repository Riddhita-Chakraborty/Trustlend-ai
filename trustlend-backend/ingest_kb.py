"""
ingest_kb.py
------------
One-time script to ingest the TrustLend knowledge base into ChromaDB.

Run this ONCE from inside trustlend-backend/ before starting the Flask server:

    cd trustlend-backend
    python ingest_kb.py

After this runs successfully you will see a  chroma_db/  folder appear.
You only need to re-run this if you add or edit files in knowledge_base/.
"""

import sys
import time
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)s  %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger(__name__)


def main():
    logger.info("=" * 60)
    logger.info("TrustLend — Knowledge Base Ingestion")
    logger.info("=" * 60)

    # ── Pre-flight checks ──────────────────────────────────────────────────────
    import os
    kb_path = os.path.join(os.path.dirname(__file__), 'knowledge_base')
    if not os.path.exists(kb_path):
        logger.error(
            f"knowledge_base/ folder not found at: {kb_path}\n"
            "Please create it and add the 8 KB .txt files first."
        )
        sys.exit(1)

    txt_files = [f for f in os.listdir(kb_path) if f.endswith('.txt')]
    if not txt_files:
        logger.error(f"No .txt files found inside {kb_path}")
        sys.exit(1)

    logger.info(f"Found {len(txt_files)} KB files:")
    for f in sorted(txt_files):
        logger.info(f"  • {f}")

    # ── Dependency check ───────────────────────────────────────────────────────
    missing = []
    for pkg in ['chromadb', 'sentence_transformers', 'langchain', 'langchain_community']:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg.replace('_', '-'))

    if missing:
        logger.error(
            f"Missing packages: {', '.join(missing)}\n"
            f"Install with:  pip install {' '.join(missing)}"
        )
        sys.exit(1)

    # ── Run ingestion ──────────────────────────────────────────────────────────
    logger.info("\nStarting ingestion …")
    logger.info("(First run downloads the embedding model ~90 MB — may take a minute)")

    t0 = time.time()

    from app.services.rag_service import build_knowledge_base
    num_chunks = build_knowledge_base()

    elapsed = time.time() - t0
    logger.info("=" * 60)
    logger.info(f"Done! {num_chunks} chunks embedded in {elapsed:.1f}s")
    logger.info("ChromaDB is ready at:  trustlend-backend/chroma_db/")
    logger.info("You can now start the Flask server normally.")
    logger.info("=" * 60)


if __name__ == '__main__':
    main()