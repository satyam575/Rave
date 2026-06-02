package com.rave.club.realtime;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class ClubWebSocketHandler extends TextWebSocketHandler {
  private final ObjectMapper objectMapper;
  private final RoomState roomState;
  private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
  private final Map<String, Object> sessionLocks = new ConcurrentHashMap<>();

  public ClubWebSocketHandler(ObjectMapper objectMapper, RoomState roomState) {
    this.objectMapper = objectMapper;
    this.roomState = roomState;
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    sessions.put(session.getId(), session);
    sessionLocks.put(session.getId(), new Object());
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage textMessage) throws Exception {
    JsonNode root = objectMapper.readTree(textMessage.getPayload());
    String type = root.path("type").asText("");
    JsonNode payload = root.path("payload");

    switch (type) {
      case "join" -> handleJoin(session, payload);
      case "position" -> handlePosition(session, payload);
      case "dance" -> handleDance(session, payload);
      case "cloud" -> handleCloud(session, payload);
      default -> send(session, WsMessage.server("error", "server", Map.of("message", "Unknown message type")));
    }
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
    sessions.remove(session.getId());
    sessionLocks.remove(session.getId());
    roomState.remove(session.getId()).ifPresent(player ->
        broadcast(WsMessage.server("player_leave", session.getId(), Map.of("playerId", player.id())))
    );
  }

  private void handleJoin(WebSocketSession session, JsonNode payload) throws IOException {
    PlayerState player = roomState.join(
        session.getId(),
        payload.path("displayName").asText("guest"),
        payload.path("avatarStyle").asInt(0)
    );

    send(session, WsMessage.server("snapshot", "server", Map.of(
        "selfId", session.getId(),
        "players", roomState.snapshot()
    )));
    broadcastExcept(session.getId(), WsMessage.server("player_join", session.getId(), player));
    broadcast(WsMessage.server("avatar", session.getId(), player));
  }

  private void handlePosition(WebSocketSession session, JsonNode payload) {
    roomState.updatePosition(
        session.getId(),
        payload.path("x").asDouble(0),
        payload.path("z").asDouble(0),
        payload.path("facing").asDouble(0)
    ).ifPresent(player -> broadcastExcept(session.getId(), WsMessage.server("position", session.getId(), player)));
  }

  private void handleDance(WebSocketSession session, JsonNode payload) {
    roomState.setDancing(session.getId(), payload.path("dancing").asBoolean(false))
        .ifPresent(player -> broadcast(WsMessage.server("dance", session.getId(), Map.of(
            "playerId", player.id(),
            "dancing", player.dancing()
        ))));
  }

  private void handleCloud(WebSocketSession session, JsonNode payload) {
    if (roomState.get(session.getId()).isEmpty()) {
      return;
    }
    CloudState cloud = roomState.cloud(session.getId(), payload.path("text").asText(""));
    broadcast(WsMessage.server("cloud", session.getId(), cloud));
  }

  private void broadcast(WsMessage message) {
    sessions.values().forEach(session -> sendQuietly(session, message));
  }

  private void broadcastExcept(String excludedSessionId, WsMessage message) {
    sessions.values().stream()
        .filter(session -> !session.getId().equals(excludedSessionId))
        .forEach(session -> sendQuietly(session, message));
  }

  private void sendQuietly(WebSocketSession session, WsMessage message) {
    try {
      send(session, message);
    } catch (IOException | IllegalStateException ignored) {
      sessions.remove(session.getId());
      sessionLocks.remove(session.getId());
    }
  }

  private void send(WebSocketSession session, WsMessage message) throws IOException {
    Object lock = sessionLocks.computeIfAbsent(session.getId(), id -> new Object());
    synchronized (lock) {
      if (session.isOpen()) {
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
      }
    }
  }
}
