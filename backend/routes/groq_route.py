from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from services.groq_service import GroqService
from models.groq_model import ChatRequest, ChatResponse, MessageRole
from .auth import verify_firebase_token
import logging
from sse_starlette.sse import EventSourceResponse

router = APIRouter(prefix="/api/chat", tags=["chat"])
groq_service = GroqService()

@router.post("/completion")
async def create_chat_completion(
    request: ChatRequest,
    user_id: str = Depends(verify_firebase_token)
):
    """
    Create a chat completion using Groq API
    
    Parameters:
    - messages: List of chat messages with role and content
    - model: Model to use (default: llama3-8b-8192)
    - stream: Whether to stream the response (default: False)
    
    Returns:
    - If stream=False: A single ChatResponse
    - If stream=True: Server-Sent Events stream of response chunks
    """
    try:
        completion = await groq_service.create_chat_completion(request)
        
        if request.stream:
            return EventSourceResponse(
                completion,
                media_type="text/event-stream"
            )
        return completion
        
    except Exception as e:
        logging.error(f"Error in chat completion route: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )