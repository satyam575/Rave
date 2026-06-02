package com.rave.club.config;

import com.rave.club.realtime.ClubWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
  private final ClubWebSocketHandler clubWebSocketHandler;

  public WebSocketConfig(ClubWebSocketHandler clubWebSocketHandler) {
    this.clubWebSocketHandler = clubWebSocketHandler;
  }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry
        .addHandler(clubWebSocketHandler, "/ws/room")
        .setAllowedOriginPatterns("*");
  }
}
