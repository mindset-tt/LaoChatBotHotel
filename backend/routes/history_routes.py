# routes/history_routes.py
from typing import List, Dict
from fastapi import APIRouter, HTTPException
from models.schemas import HistoryEntry, FlatHistoryEntry
from database.operations import db_connection

router = APIRouter(prefix="/history", tags=["Chat History"])

@router.get("/allContent", response_model=Dict[str, List[HistoryEntry]])
async def get_all_sessions_and_history():
    """Retrieves the complete chat history for all sessions."""
    sessions_with_history = {}
    conn = db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT session_id, role, content, timestamp
        FROM chat_history
        ORDER BY session_id, timestamp ASC
    """)
    all_history_records = cursor.fetchall()
    conn.close()

    if not all_history_records:
        return {}

    for record in all_history_records:
        session_id = record['session_id']
        if session_id not in sessions_with_history:
            sessions_with_history[session_id] = []
        
        sessions_with_history[session_id].append({
            "role": record['role'],
            "content": record['content'],
            "timestamp": record['timestamp']
        })

    return sessions_with_history

@router.get("/all", response_model=List[FlatHistoryEntry])
async def get_all_sessions_first_messages():
    """Retrieves only the first user input from every session."""
    flat_history_list = []
    conn = db_connection()
    cursor = conn.cursor()

    sql_query = """
        WITH RankedMessages AS (
            SELECT
                session_id,
                role,
                content,
                timestamp,
                ROW_NUMBER() OVER(PARTITION BY session_id ORDER BY timestamp ASC) as rn
            FROM
                chat_history
            WHERE
                role = 'user'
        )
        SELECT
            session_id,
            role,
            content,
            timestamp
        FROM
            RankedMessages
        WHERE
            rn = 1
        ORDER BY
            timestamp DESC;
    """

    cursor.execute(sql_query)
    first_user_inputs = cursor.fetchall()
    conn.close()

    if not first_user_inputs:
        return []

    for record in first_user_inputs:
        content_data = {
            "role": record['role'],
            "content": record['content'],
            "timestamp": record['timestamp']
        }
        flat_history_list.append({
            "sessionID": record['session_id'],
            "content": content_data
        })

    return flat_history_list

@router.get("/{session_id}", response_model=List[HistoryEntry])
async def get_session_history(session_id: str):
    """Get history for a specific session"""
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT role, content, timestamp FROM chat_history WHERE session_id = ? ORDER BY timestamp ASC", (session_id,))
    history = cursor.fetchall()
    conn.close()
    if not history:
        raise HTTPException(status_code=404, detail="Session ID not found or history is empty.")
    return [dict(row) for row in history]
