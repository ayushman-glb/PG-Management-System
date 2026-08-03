export abstract class BaseMapper<Entity, DTO> {
  abstract toDTO(entity: Entity): DTO;
  abstract toEntity(dto: DTO): Entity;
}
