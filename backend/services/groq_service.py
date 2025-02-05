import asyncio
import os
import json
import logging
from groq import Groq
from fastapi import HTTPException
from sse_starlette.sse import ServerSentEvent
from typing import Generator, Union
from models.groq_model import ChatRequest, ChatResponse, MessageRole

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    async def create_chat_completion(
        self, 
        request: ChatRequest
    ) -> Union[ChatResponse, Generator[ServerSentEvent, None, None]]:
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[{"role": msg.role, "content": msg.content} for msg in request.messages],
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
                            await asyncio.sleep(0)
                    except Exception as e:
                        logger.error(f"Streaming error: {str(e)}", exc_info=True)
                        yield ServerSentEvent(
                            data=json.dumps({"error": str(e)}),
                            event="error"
                        )
                    finally:
                        yield ServerSentEvent(data="", event="close")
                
                return generate_events()
            else:
                response_content = chat_completion.choices[0].message.content
                logger.info(f"Groq API response: {response_content}")
                return ChatResponse(
                    content=response_content,
                    role=MessageRole.ASSISTANT,
                    model=request.model
                )
        except Exception as e:
            logger.error(f"Error processing chat completion: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error processing chat completion: {str(e)}"
            )