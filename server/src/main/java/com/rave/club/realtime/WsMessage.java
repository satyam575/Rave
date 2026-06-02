package com.rave.club.realtime;

public record WsMessage(String type, String senderId, Object payload) {
  public static WsMessage server(String type, String senderId, Object payload) {
    return new WsMessage(type, senderId, payload);
  }
}
