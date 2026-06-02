package com.rave.club.realtime;

import java.security.SecureRandom;
import java.util.Collection;
import java.util.Comparator;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class RoomState {
  private static final SecureRandom RANDOM = new SecureRandom();
  private final Map<String, PlayerState> players = new ConcurrentHashMap<>();

  public PlayerState join(String sessionId, String displayName, int avatarStyle) {
    double x = -2.0 + RANDOM.nextDouble(4.0);
    double z = -0.8 + RANDOM.nextDouble(2.0);
    PlayerState player = new PlayerState(
        sessionId,
        sanitize(displayName, 16, "guest"),
        clampInt(avatarStyle, 0, 5),
        x,
        z,
        0,
        false
    );
    players.put(sessionId, player);
    return player;
  }

  public Optional<PlayerState> updatePosition(String sessionId, double x, double z, double facing) {
    return Optional.ofNullable(players.computeIfPresent(sessionId, (id, current) ->
        current.withPosition(clamp(x, -9.2, 9.2), clamp(z, -5.8, 4.8), facing)
    ));
  }

  public Optional<PlayerState> setDancing(String sessionId, boolean dancing) {
    return Optional.ofNullable(players.computeIfPresent(sessionId, (id, current) -> current.withDancing(dancing)));
  }

  public Optional<PlayerState> remove(String sessionId) {
    return Optional.ofNullable(players.remove(sessionId));
  }

  public Optional<PlayerState> get(String sessionId) {
    return Optional.ofNullable(players.get(sessionId));
  }

  public Collection<PlayerState> snapshot() {
    return players.values().stream()
        .sorted(Comparator.comparing(PlayerState::displayName))
        .toList();
  }

  public CloudState cloud(String sessionId, String rawText) {
    String text = sanitize(rawText, 24, "...");
    return new CloudState(sessionId + "-" + System.currentTimeMillis(), sessionId, text, System.currentTimeMillis() + 2_000);
  }

  private static String sanitize(String raw, int maxLength, String fallback) {
    if (raw == null) {
      return fallback;
    }
    String cleaned = raw.trim().replaceAll("\\s+", " ");
    if (cleaned.isEmpty()) {
      return fallback;
    }
    return cleaned.substring(0, Math.min(maxLength, cleaned.length()));
  }

  private static double clamp(double value, double min, double max) {
    return Math.max(min, Math.min(max, value));
  }

  private static int clampInt(int value, int min, int max) {
    return Math.max(min, Math.min(max, value));
  }
}
