from groq import Groq
import os
from fastapi import HTTPException
from models.groq_model import ChatRequest, ChatResponse, MessageRole
import logging
from .firebase_service import FirebaseService
from typing import Generator, Union
from sse_starlette.sse import ServerSentEvent
import json
import asyncio

class GroqService(FirebaseService):
    def __init__(self):
        super().__init__()
        self.client = Groq(
            api_key=os.environ.get("GROQ_API_KEY")
        )

    async def create_chat_completion(
        self, 
        request: ChatRequest
    ) -> Union[ChatResponse, Generator[ServerSentEvent, None, None]]:
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[{
                    "role": msg.role,
                    "content": msg.content
                } for msg in request.messages],
                model=request.model,
                stream=request.stream
            )
            
            if request.stream:
                async def generate_events():
                    try:
                        for chunk in chat_completion:
                            if chunk.choices[0].delta.content:
                                yield ServerSentEvent(
                                    data=json.dumps({
                                        "content": chunk.choices[0].delta.content,
                                        "role": MessageRole.ASSISTANT
                                    }),
                                    event="message"
                                )
                            await asyncio.sleep(0)  # Allow other tasks to run
                    except Exception as e:
                        logging.error(f"Streaming error: {str(e)}")
                        yield ServerSentEvent(
                            data=json.dumps({"error": str(e)}),
                            event="error"
                        )
                    finally:
                        yield ServerSentEvent(data="", event="close")
                
                return generate_events()
            else:
                return ChatResponse(
                    content=chat_completion.choices[0].message.content,
                    role=MessageRole.ASSISTANT
                )
        except Exception as e:
            logging.error(f"Error processing chat completion: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error processing chat completion: {str(e)}"
            )