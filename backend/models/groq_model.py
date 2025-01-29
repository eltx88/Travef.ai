from pydantic import BaseModel
from typing import List
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
    model: str = "llama3-8b-8192"
    stream: bool = False

class ChatResponse(BaseModel):
    content: str
    role: str = MessageRole.ASSISTANT