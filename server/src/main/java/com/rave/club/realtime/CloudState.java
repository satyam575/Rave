package com.rave.club.realtime;

public record CloudState(String id, String playerId, String text, long expiresAt) {
}
