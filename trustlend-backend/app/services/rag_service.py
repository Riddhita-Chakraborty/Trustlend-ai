"""
rag_service.py
--------------
RAG pipeline for TrustLend — retrieves relevant KB chunks with source metadata.

Place at: trustlend-backend/app/services/rag_service.py
"""

import os
import glob
import logging

logger = logging.getLogger(__name__)

BASE_DIR            = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
KNOWLEDGE_BASE_PATH = os.path.join(BASE_DIR, 'knowledge_base')
CHROMA_DB_PATH      = os.path.join(BASE_DIR, 'chroma_db')
COLLECTION_NAME     = 'trustlend_kb'

_embeddings  = None
_vectorstore = None


def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        logger.info("Loading embedding model (all-MiniLM-L6-v2)...")
        _embeddings = HuggingFaceEmbeddings(
            model_name='all-MiniLM-L6-v2',
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True},
        )
    return _embeddings


def _get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        from langchain_community.vectorstores import Chroma
        if not os.path.exists(CHROMA_DB_PATH):
            raise FileNotFoundError(
                f"ChromaDB not found at '{CHROMA_DB_PATH}'. "
                "Run  python ingest_kb.py  from trustlend-backend/ first."
            )
        _vectorstore = Chroma(
            collection_name=COLLECTION_NAME,
            persist_directory=CHROMA_DB_PATH,
            embedding_function=_get_embeddings(),
        )
    return _vectorstore


KB_FILE_LABELS = {
    '01_rbi_fair_practices_code.txt':         'RBI Fair Practices Code (2003)',
    '02_rbi_penal_charges_2023.txt':          'RBI Penal Charges Circular (Aug 2023)',
    '03_rbi_kfs_guidelines_2024.txt':         'RBI KFS Guidelines (Apr 2024)',
    '04_interest_rate_benchmarks.txt':        'India Interest Rate Benchmarks (2026)',
    '05_predatory_clause_glossary.txt':       'Predatory Clause Glossary',
    '06_nbfc_digital_lending_guidelines.txt': 'NBFC & Digital Lending Guidelines',
    '07_fair_clause_templates.txt':           'Fair Clause Reference Templates',
    '08_master_scoring_checklist.txt':        'Master Scoring Checklist',
}


def build_knowledge_base():
    """Ingest all KB .txt files into ChromaDB. Run once via ingest_kb.py."""
    from langchain_community.vectorstores import Chroma
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain.schema import Document

    txt_files = glob.glob(os.path.join(KNOWLEDGE_BASE_PATH, '*.txt'))
    if not txt_files:
        raise FileNotFoundError(f"No .txt files found in '{KNOWLEDGE_BASE_PATH}'.")

    raw_docs = []
    for filepath in sorted(txt_files):
        filename = os.path.basename(filepath)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        raw_docs.append({'content': content, 'source': filename})
        logger.info(f"  Loaded: {filename} ({len(content)} chars)")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=120,
        separators=['\n\n', '\n', '. ', ' ', ''],
    )

    all_chunks = []
    for doc in raw_docs:
        chunks = splitter.split_text(doc['content'])
        for i, chunk in enumerate(chunks):
            all_chunks.append(Document(
                page_content=chunk,
                metadata={
                    'source': doc['source'],
                    'label':  KB_FILE_LABELS.get(doc['source'], doc['source']),
                    'chunk_index': i,
                },
            ))

    logger.info(f"Split {len(raw_docs)} docs into {len(all_chunks)} chunks.")

    if os.path.exists(CHROMA_DB_PATH):
        import shutil
        shutil.rmtree(CHROMA_DB_PATH)

    vectorstore = Chroma.from_documents(
        documents=all_chunks,
        embedding=_get_embeddings(),
        collection_name=COLLECTION_NAME,
        persist_directory=CHROMA_DB_PATH,
    )
    vectorstore.persist()
    logger.info(f"Knowledge base built -> {CHROMA_DB_PATH}")
    return len(all_chunks)


def retrieve_with_citations(loan_text: str, k: int = 8):
    """
    Returns (context_string, citations_list).

    citations_list items:
    {
        "source_file":  "02_rbi_penal_charges_2023.txt",
        "source_label": "RBI Penal Charges Circular (Aug 2023)",
        "excerpt":      "Penal charges must NOT be capitalised..."
    }
    """
    if not loan_text or not loan_text.strip():
        return "", []
    try:
        db    = _get_vectorstore()
        query = loan_text[:2000].strip()
        docs  = db.similarity_search(query, k=k)
        if not docs:
            return "", []

        context_parts = []
        citations     = []
        seen          = set()

        for doc in docs:
            source_file  = doc.metadata.get('source', '')
            source_label = doc.metadata.get('label', source_file)
            excerpt      = doc.page_content.strip()
            short_key    = excerpt[:80]
            if short_key in seen:
                continue
            seen.add(short_key)

            context_parts.append(f"[Source: {source_label}]\n{excerpt}")
            citations.append({
                "source_file":  source_file,
                "source_label": source_label,
                "excerpt":      excerpt[:300] + ("..." if len(excerpt) > 300 else ""),
            })

        return "\n\n---\n\n".join(context_parts), citations

    except FileNotFoundError as e:
        logger.error(f"RAG: DB not found - {e}")
        return "", []
    except Exception as e:
        logger.error(f"RAG retrieval error: {e}")
        return "", []


# Keep old signature for backwards compat
def retrieve_relevant_context(loan_text: str, k: int = 6) -> str:
    context, _ = retrieve_with_citations(loan_text, k=k)
    return context