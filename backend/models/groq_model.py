from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

# "user": Messages from the human/end-user
# "assistant": Messages from the AI assistant
# "system": Special messages that set the context or behavior of the AI(set user preference)
class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"

class ChatMessage(BaseModel):
    role: MessageRole
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "llama-3.3-70b-versatile"
    stream: bool = False

class ChatResponse(BaseModel):
    content: str
    role: MessageRole = MessageRole.ASSISTANT
    model: Optional[str] = None

