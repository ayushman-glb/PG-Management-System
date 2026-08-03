export interface RoomTransferDTO {
  residentId: string;
  currentRoomId: string;
  targetRoomId: string;
  reason?: string;
}
