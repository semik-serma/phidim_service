# Booking chat typing integration

The frontend sends `{"type":"typing.start"}` and `{"type":"typing.stop"}` on the existing authenticated `/ws/chat/<booking_id>/` socket. It accepts `{"type":"chat.typing","user_id":123,"is_typing":true}` (or false), or `{"type":"typing.start","user_id":123}` / `{"type":"typing.stop","user_id":123}`. Typing events are ephemeral and must never be saved as chat messages.

The supplied ShareLocationConsumer runs on a different socket. Add the typing branch to your **chat consumer** before its unsupported-message check, and add this delivery handler to that same class. The Django backend is outside this frontend repository, so this change must be applied there.

```python
# In receive_json, before message validation:
if content.get("type") in ("typing.start", "typing.stop"):
    await aclose_old_connections()
    access = await self.get_booking_access(self.booking_id, self.user.id)
    if access is None:
        await self.close(code=4403)
        return
    await self.channel_layer.group_send(self.group_name, {
        "type": "chat_typing",
        "user_id": self.user.id,
        "is_typing": content["type"] == "typing.start",
    })
    return

# Add as a method on the chat consumer:
async def chat_typing(self, event):
    await aclose_old_connections()
    access = await self.get_booking_access(self.booking_id, self.user.id)
    if access is None:
        await self.close(code=4403)
        return
    if self.user.id == event["user_id"]:
        return
    await self.send_json({
        "type": "chat.typing",
        "user_id": event["user_id"],
        "is_typing": event["is_typing"],
    })
```

Reuse your chat consumer's authorization helper and authorized booking group if their names differ. Import `aclose_old_connections` from `channels.db`. Both participants must use the same group. If the location consumer also broadcasts `chat_typing` into that shared group, it also needs a `chat_typing` handler to avoid unhandled channel events.

The client sends start at most every two seconds during sustained typing, stop after 1.5 seconds idle, and stop on blur, send, or leaving the conversation. Received indicators expire after five seconds, clear on a received message or disconnection, and ignore the current user's events.

Manual live check after applying the backend change: open the same confirmed booking as the customer and assigned technician; type without sending in each direction; verify the indicator clears after idle, blur, send, and closing the other tab. Verify history and messages still work and unauthorized bookings close with 4403. Local frontend tests do not establish live Django delivery.
