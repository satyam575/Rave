package com.rave.club.realtime;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RoomStateTest {
  @Test
  void clampsAndSanitizesJoinedPlayers() {
    RoomState roomState = new RoomState();

    PlayerState player = roomState.join("s1", "  very   long   display   name  ", 99);

    assertThat(player.displayName()).hasSizeLessThanOrEqualTo(16);
    assertThat(player.displayName()).doesNotContain("  ");
    assertThat(player.avatarStyle()).isEqualTo(5);
  }

  @Test
  void clampsPositionUpdates() {
    RoomState roomState = new RoomState();
    roomState.join("s1", "mina", 1);

    PlayerState player = roomState.updatePosition("s1", 100, -100, 4).orElseThrow();

    assertThat(player.x()).isEqualTo(9.2);
    assertThat(player.z()).isEqualTo(-5.8);
    assertThat(player.facing()).isEqualTo(4);
  }
}
