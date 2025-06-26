# services/conversation.py
import re
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional

# These imports will be available when packages are installed
try:
    from sentence_transformers import util
    from laonlp.tokenize import word_tokenize
except ImportError:
    # Handle import errors gracefully during development
    util = None
    word_tokenize = None

from config.settings import CONFIG, ROOM_NUMBERS
from database.operations import get_available_rooms_from_db, get_room_details_from_db, book_room_in_db

# Import model_store with error handling
try:
    from services.ml_models import model_store
except ImportError:
    # Create a dummy model_store for development
    class DummyModelStore:
        def __init__(self):
            self.retriever = None
            self.booking_intent_embedding = None
    model_store = DummyModelStore()

class ConversationManager:
    def __init__(self):
        self.states: Dict[str, str] = {}
        self.pending_bookings: Dict[str, Dict] = {}

    def get_state(self, session_id: str) -> str: 
        return self.states.get(session_id, "NORMAL")
    
    def set_state(self, session_id: str, state: str, booking_info: Optional[Dict] = None):
        logging.info(f"Session '{session_id}' state changed to: {state}")
        self.states[session_id] = state
        if booking_info is not None: 
            self.pending_bookings[session_id] = booking_info
    
    def get_pending_booking(self, session_id: str) -> Optional[Dict]: 
        return self.pending_bookings.get(session_id)
    
    def clear_session(self, session_id: str) -> bool:
        cleared = False
        if session_id in self.states: 
            del self.states[session_id]
            cleared = True
        if session_id in self.pending_bookings: 
            del self.pending_bookings[session_id]
            cleared = True
        return cleared

# Global conversation manager
convo_manager = ConversationManager()

def parse_dates(text: str) -> Optional[Tuple[datetime, datetime]]:
    matches = re.findall(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', text)
    if len(matches) >= 2:
        try:
            date1 = datetime.strptime(f"{matches[0][0]}-{matches[0][1]}-{matches[0][2]}", '%d-%m-%Y').date()
            date2 = datetime.strptime(f"{matches[1][0]}-{matches[1][1]}-{matches[1][2]}", '%d-%m-%Y').date()
            return (min(date1, date2), max(date1, date2))
        except ValueError: 
            pass
    if "tomorrow" in text or "ມື້ອື່ນ" in text:
        start_date = datetime.now() + timedelta(days=1)
        duration_match = re.search(r'(\d+)\s*(day|night|ຄືນ|ມື້)', text)
        if duration_match:
            days = int(duration_match.group(1))
            end_date = start_date + timedelta(days=days)
            return start_date.date(), end_date.date()
    return None

def detect_booking_intent(tokenized_query: str) -> bool:
    if any(keyword in tokenized_query.lower() for keyword in CONFIG.BOOKING_INTENT_KEYWORDS): 
        return True
    try:
        if model_store.retriever and model_store.booking_intent_embedding:
            query_embedding = model_store.retriever.encode(tokenized_query, convert_to_tensor=True, device=model_store.device)
            score = util.cos_sim(query_embedding, model_store.booking_intent_embedding)[0][0].item()
            return score > CONFIG.BOOKING_SIMILARITY_THRESHOLD
    except:
        pass
    return False

def detect_price_inquiry(user_input: str) -> bool:
    """Detect if user is asking about price"""
    return any(keyword in user_input.lower() for keyword in CONFIG.PRICE_INQUIRY_KEYWORDS)

def handle_booking_request(session_id: str) -> Tuple[str, str]:
    available_rooms = get_available_rooms_from_db()
    if not available_rooms: 
        return "ຂໍອະໄພ, ຕອນນີ້ບໍ່ມີຫ້ອງວ່າງເລີຍ.", "STATUS_CHECK"
    rooms_list_str = ", ".join(available_rooms)
    reply = f"ແນ່ນອນ, ຕອນນີ້ພວກເຮົາມີຫ້ອງວ່າງດັ່ງນີ້: {rooms_list_str}. ກະລຸນາເລືອກໝາຍເລກຫ້ອງທີ່ທ່ານຕ້ອງການ."
    convo_manager.set_state(session_id, "AWAITING_ROOM_CHOICE")
    return reply, "BOOKING_SUGGESTION"

def handle_room_selection(user_input: str, session_id: str) -> Tuple[str, str]:
    # Check if user is asking about price during room selection
    if detect_price_inquiry(user_input):
        return "ກະລຸນາເລືອກໝາຍເລກຫ້ອງກ່ອນ. ຂໍ້ມູນລາຄາໄດ້ແຈ້ງໄວ້ແລ້ວຕອນເລີ່ມຕົ້ນ.", "FOCUS_ON_BOOKING"
    
    selected_room = next((word for word in user_input.split() if word in ROOM_NUMBERS), None)
    if not selected_room: 
        return "ຂໍອະໄພ, ຂ້ອຍບໍ່ເຫັນໝາຍເລກຫ້ອງທີ່ຖືກຕ້ອງ. ກະລຸນາລອງໃໝ່.", "INVALID_ROOM"
    room_details = get_room_details_from_db(selected_room)
    if not room_details or room_details['status'] != 'Available':
        return f"ຫ້ອງ {selected_room} ບໍ່ວ່າງ. ກະລຸນາເລືອກຫ້ອງອື່ນຈາກລາຍການ: {', '.join(get_available_rooms_from_db())}", "STATUS_CHECK"
    convo_manager.set_state(session_id, "AWAITING_DATES", booking_info={"room": selected_room})
    reply = f"ເຂົ້າໃຈແລ້ວ, ທ່ານເລືອກຫ້ອງ {selected_room}. ກະລຸນາລະບຸວັນທີເລີ່ມຈອງ ແລະ ວັນທີສິ້ນສຸດ (ຕົວຢ່າງ: 11/06/2025 - 13/06/2025 ຫຼື 'ມື້ອື່ນ 2 ຄືນ')."
    return reply, "DATE_REQUEST"

def handle_date_selection(user_input: str, session_id: str) -> Tuple[str, str]:
    # Check if user is asking about price during date selection
    if detect_price_inquiry(user_input):
        return "ກະລຸນາລະບຸວັນທີເລີ່ມຈອງ ແລະ ວັນທີສິ້ນສຸດກ່ອນ. ຂໍ້ມູນລາຄາໄດ້ແຈ້ງໄວ້ແລ້ວຕອນເລີ່ມຕົ້ນ.", "FOCUS_ON_BOOKING"
    
    dates = parse_dates(user_input)
    pending_booking = convo_manager.get_pending_booking(session_id)
    if not dates or not pending_booking: 
        return "ຂໍອະໄພ, ຂ້ອຍບໍ່ເຂົ້າໃຈຮູບແບບວັນທີ. ກະລຸນາໃຊ້ຮູບແບບ DD/MM/YYYY ຫຼື 'ມື້ອື່ນ x ຄືນ'.", "INVALID_DATE"
    start_date, end_date = dates
    pending_booking['start_date'] = start_date.strftime('%Y-%m-%d')
    pending_booking['end_date'] = end_date.strftime('%Y-%m-%d')
    convo_manager.set_state(session_id, "AWAITING_BOOKING_CONFIRMATION", booking_info=pending_booking)
    reply = (f"ທ່ານຕ້ອງການຈອງຫ້ອງ {pending_booking['room']} "
             f"ແຕ່ວັນທີ {pending_booking['start_date']} ຫາ {pending_booking['end_date']}, ແມ່ນບໍ່? (ແມ່ນ/ບໍ່)")
    return reply, "CONFIRMATION_REQUEST"

def handle_booking_confirmation(user_input: str, session_id: str) -> Tuple[str, str]:
    pending_booking = convo_manager.get_pending_booking(session_id)
    if not pending_booking:
        convo_manager.set_state(session_id, "NORMAL")
        return "ເກີດຂໍ້ຜິດພາດ, ກະລຸນາເລີ່ມການຈອງໃໝ່.", "ERROR"
    
    # Check if user is asking about price during booking confirmation
    if detect_price_inquiry(user_input):
        return "ກະລຸນາຕອບ ແມ່ນ ຫຼື ບໍ່ ສຳລັບການຢືນຢັນການຈອງກ່ອນ. ຂໍ້ມູນລາຄາໄດ້ແຈ້ງໄວ້ແລ້ວຕອນເລີ່ມຕົ້ນ.", "FOCUS_ON_BOOKING"
    
    if any(keyword in user_input.lower() for keyword in CONFIG.CONFIRMATION_KEYWORDS):
        success = book_room_in_db(pending_booking['room'], pending_booking['start_date'], pending_booking['end_date'], f"Booked via Chatbot session {session_id}")
        convo_manager.clear_session(session_id)
        if success: 
            return f"ສຳເລັດ! ຫ້ອງ {pending_booking['room']} ໄດ້ຖືກຈອງໃຫ່ທ່ານແລ້ວ. ຂອບໃຈທີ່ໃຊ້ບໍລິການ.", "BOOKING_CONFIRMED"
        else: 
            return "ຂໍອະໄພ, ເກີດຂໍ້ຜິດພາດໃນຂະນະທີ່ພະຍາຍາມຈອງ. ຫ້ອງນັ້ນອາດຈະຖືກຈອງໄປແລ້ວ. ກະລຸນາລອງໃໝ່.", "ERROR"
    else:
        convo_manager.clear_session(session_id)
        return "ການຈອງໄດ້ຖືກຍົກເລີກ. ຖ້າທ່ານຕ້ອງການເລີ່ມໃໝ່, ພຽງແຕ່ບອກຂ້ອຍ.", "BOOKING_CANCELLED"
