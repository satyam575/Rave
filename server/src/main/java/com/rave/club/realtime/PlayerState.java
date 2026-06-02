package com.rave.club.realtime;

public record PlayerState(
    String id,
    String displayName,
    int avatarStyle,
    double x,
    double z,
    double facing,
    boolean dancing
) {
  public PlayerState withPosition(double nextX, double nextZ, double nextFacing) {
    return new PlayerState(id, displayName, avatarStyle, nextX, nextZ, nextFacing, dancing);
  }

  public PlayerState withDancing(boolean nextDancing) {
    return new PlayerState(id, displayName, avatarStyle, x, z, facing, nextDancing);
  }
}
